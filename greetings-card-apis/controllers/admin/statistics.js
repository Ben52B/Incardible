const { success_response, error_response } = require('../../utils/response');
const User = require('../../models/user');
const Card = require('../../models/card');
const CardCustomization = require('../../models/card_customization');
const TransactionData = require('../../models/transactionData');
const ContactUs = require('../../models/contactUs');
const Counter = require('../../models/counter');

// Get most popular cards based on ACTUAL SALES from TransactionData
// Logic: Analyze TransactionData to find which cards have been sold most
// Priority: totalQuantitySold > salesCount > totalRevenue (NOT views)
// Most popular cards by actual sales (times sold), with revenue, views, and total quantity.
// Assumes: TransactionData.status === 'COMPLETED' for completed sales.

// exports.getMostPopularCards = async (req, res) => {
//     try {
 
// const customizationColl = CardCustomization.collection.name;
// const cardColl = Card.collection.name;

// const popularCards = await TransactionData.aggregate([
//   { $match: { status: 'COMPLETED' } },
//   {
//     $lookup: {
//       from: customizationColl,
//       localField: 'cardCustomizationId',
//       foreignField: '_id',
//       as: 'cust'
//     }
//   },
//   { $unwind: '$cust' },
//   {
//     $lookup: {
//       from: cardColl,
//       localField: 'cust.cardId',
//       foreignField: '_id',
//       as: 'card'
//     }
//   },
//   { $unwind: '$card' },
//   { $match: { 'card.deleteCard': { $ne: true } } },
//   {
//     $group: {
//       _id: '$card._id',
//       title: { $first: '$card.title' },
//       price: { $first: '$card.price' },
//       views: { $first: { $ifNull: ['$card.views', 0] } },
//       salesCount: { $sum: 1 },
//       totalQuantitySold: { $sum: { $ifNull: ['$quantity', 0] } },
//       totalRevenue: { $sum: { $ifNull: ['$total', 0] } }
//     }
//   },
//   { $sort: { totalQuantitySold: -1, salesCount: -1 } },
//   { $limit: 1 }
// ]);

  
// return success_response(res, 200, "Dashboard statistics fetched successfully", {

//     popularCards
//     // recentTransactions,
//     // timeframe
//   });
  
//     } catch (error) {
//       return error_response(res, 500, error.message);
//     }
//   };
  
  
  
  
exports.getMostPopularCards = async (req, res) => {
    try {
        const { limit = 15} = req.query; // Set to 7 for testing

        console.log('=== ANALYZING SALES DATA FROM TRANSACTIONDATA ===');
        
        // Step 1: Get all transactions from TransactionData
        const allTransactions = await TransactionData.find({});
        console.log('Total transactions in TransactionData:', allTransactions.length);
        
        if (allTransactions.length === 0) {
            console.log('No transactions found in TransactionData - returning available cards');
            
            // If no transactions, return available cards from Card model
            const availableCards = await Card.find({ 
                deleteCard: { $ne: true } 
            }).limit(parseInt(limit)).select('_id uuid title price frontDesign views envelope insideLeftDesign insideRightDesign');
            
            console.log('Available cards found:', availableCards.length);
            
            // Format cards to match expected structure
            const formattedCards = availableCards.map(card => ({
                _id: card._id,
                uuid: card.uuid,
                title: card.title,
                price: card.price,
                frontDesign: card.frontDesign,
                envelope: card.envelope,
                insideLeftDesign: card.insideLeftDesign,
                insideRightDesign: card.insideRightDesign,
                views: card.views || 0,
                salesCount: 0,
                totalQuantitySold: 0,
                totalRevenue: 0,
                avgOrderValue: 0
            }));
            
            return success_response(res, 200, "Available cards (no sales data yet)", formattedCards);
        }

        // Step 2: Analyze each transaction to find card sales
        console.log('=== PROCESSING EACH TRANSACTION ===');
        const cardSalesMap = new Map();
        
        for (let i = 0; i < allTransactions.length; i++) {
            const transaction = allTransactions[i];
            console.log(`\n--- Processing Transaction ${i + 1}/${allTransactions.length} ---`);
            console.log('Transaction ID:', transaction._id);
            console.log('Transaction cardCustomizationId:', transaction.cardCustomizationId);
            console.log('Transaction quantity:', transaction.quantity);
            console.log('Transaction total:', transaction.total);
            console.log('Transaction title:', transaction.title);
            
            try {
                // Find the card customization
                const customization = await CardCustomization.findById(transaction.cardCustomizationId);
                console.log('Found customization:', customization ? 'YES' : 'NO');
                
                if (customization) {
                    console.log('Customization cardId:', customization.cardId);
                    
                    // Find the actual card
                    const card = await Card.findById(customization.cardId);
                    console.log('Found card:', card ? card.title : 'NO');
                    
                    if (card && !card.deleteCard) {
                        const cardId = card._id.toString();
                        console.log('Processing card:', card.title, 'ID:', cardId);
                        
                        // Initialize card data if not exists
                        if (!cardSalesMap.has(cardId)) {
                            cardSalesMap.set(cardId, {
                                _id: card._id,
                                uuid: card.uuid,
                                title: card.title,
                                price: card.price,
                                cardType: card.cardType,
                                frontDesign: card.frontDesign,
                                envelope: card.envelope,
                                insideLeftDesign: card.insideLeftDesign,
                                insideRightDesign: card.insideRightDesign,
                                views: card.views,
                                salesCount: 0,           // Number of times sold
                                totalQuantitySold: 0,    // Total units sold
                                totalRevenue: 0,         // Total money earned
                                avgOrderValue: 0        // Average order value
                            });
                        }
                        
                        // Update sales data
                        const cardData = cardSalesMap.get(cardId);
                        cardData.salesCount += 1;                    // Increment sales count
                        cardData.totalQuantitySold += transaction.quantity;  // Add quantity sold
                        cardData.totalRevenue += transaction.total;          // Add revenue
                        cardData.avgOrderValue = cardData.totalRevenue / cardData.salesCount;
                        
                        console.log('Updated card sales data:', {
                            title: cardData.title,
                            salesCount: cardData.salesCount,
                            totalQuantitySold: cardData.totalQuantitySold,
                            totalRevenue: cardData.totalRevenue,
                            avgOrderValue: cardData.avgOrderValue
                        });
                    } else {
                        console.log('Card not found or deleted');
                    }
                } else {
                    console.log('Card customization not found');
                }
            } catch (error) {
                console.log('Error processing transaction:', error.message);
            }
        }
        
        // Step 3: Convert map to array and sort by sales performance
        console.log('\n=== FINAL SALES ANALYSIS ===');
        const allCardSales = Array.from(cardSalesMap.values());
        console.log('Total cards with sales:', allCardSales.length);
        
        // Sort by total quantity sold (most popular first)
        const sortedCardSales = allCardSales.sort((a, b) => b.totalQuantitySold - a.totalQuantitySold);
        
        // Log all sales data
        console.log('\n=== ALL CARDS SALES DATA ===');
        sortedCardSales.forEach((card, index) => {
            console.log(`${index + 1}. ${card.title}:`);
            console.log(`   - Times Sold: ${card.salesCount}`);
            console.log(`   - Total Units: ${card.totalQuantitySold}`);
            console.log(`   - Total Revenue: $${card.totalRevenue}`);
            console.log(`   - Avg Order Value: $${card.avgOrderValue.toFixed(2)}`);
            console.log(`   - Views: ${card.views}`);
        });
        
        // Step 4: Mix purchased cards with default cards
        const requestedLimit = parseInt(limit);
        const purchasedCardsCount = sortedCardSales.length;
        
        console.log('\n=== MIXING PURCHASED + DEFAULT CARDS ===');
        console.log('Requested limit:', requestedLimit);
        console.log('Purchased cards count:', purchasedCardsCount);
        
        let finalCards = [];
        
        if (purchasedCardsCount >= requestedLimit) {
            // If we have enough purchased cards, show only purchased cards
            finalCards = sortedCardSales.slice(0, requestedLimit);
            console.log(`✅ Showing ${finalCards.length} purchased cards only (no default cards needed)`);
        } else {
            // Mix: Show purchased cards + fill remaining with default cards
            const purchasedCards = sortedCardSales.slice(0, purchasedCardsCount);
            const remainingSlots = requestedLimit - purchasedCardsCount;
            
            console.log(`📊 Need to fill ${remainingSlots} slots with default cards`);
            
            // Get card IDs that already have sales (to exclude them from defaults)
            const purchasedCardIds = purchasedCards.map(card => card._id.toString());
            
            // Fetch default cards (excluding cards that already have sales)
            const defaultCards = await Card.find({ 
                deleteCard: { $ne: true },
                _id: { $nin: purchasedCardIds } // Exclude purchased cards
            })
            .limit(remainingSlots)
            .select('_id uuid title price frontDesign views envelope insideLeftDesign insideRightDesign');
            
            console.log(`Found ${defaultCards.length} default cards to fill remaining slots`);
            
            // Format default cards to match structure
            const formattedDefaultCards = defaultCards.map(card => ({
                _id: card._id,
                uuid: card.uuid,
                title: card.title,
                price: card.price,
                frontDesign: card.frontDesign,
                envelope: card.envelope,
                insideLeftDesign: card.insideLeftDesign,
                insideRightDesign: card.insideRightDesign,
                views: card.views || 0,
                salesCount: 0,
                totalQuantitySold: 0,
                totalRevenue: 0,
                avgOrderValue: 0
            }));
            
            // Combine: Purchased cards first, then default cards
            finalCards = [...purchasedCards, ...formattedDefaultCards];
            
            console.log(`✅ Mixed result: ${purchasedCards.length} purchased + ${formattedDefaultCards.length} default = ${finalCards.length} total cards`);
        }
        
        console.log('\n=== FINAL RESULT ===');
        console.log('Returning', finalCards.length, 'cards');
        finalCards.forEach((card, index) => {
            console.log(`${index + 1}. ${card.title} - Sales: ${card.salesCount}, Qty: ${card.totalQuantitySold}`);
        });
        
        return success_response(res, 200, "Popular cards (purchased + default mix)", finalCards);
        
    } catch (error) {
        console.log('Error in getMostPopularCards:', error);
        return error_response(res, 500, error.message);
    }
};

// Get most popular AR templates based on templateIndex usage
exports.getMostPopularARExperiences = async (req, res) => {
    try {
        const { timeframe = 'all', limit = 1} = req.query;
        
        let dateFilter = {};
        if (timeframe !== 'all') {
            const days = parseInt(timeframe);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            dateFilter = { createdAt: { $gte: startDate } };
        }

        console.log('=== ANALYZING AR TEMPLATE USAGE ===');
        
        // Get all card customizations with AR template data
        const allCustomizations = await CardCustomization.find({
            deleteMyCard: false,
            'arTemplateData.templateIndex': { $exists: true },
            ...dateFilter
        });

        console.log('Total AR customizations found:', allCustomizations.length);

        if (allCustomizations.length === 0) {
            console.log('No AR customizations found - returning empty result');
            return success_response(res, 200, "No AR customizations available", []);
        }

        // Analyze template usage
        const templateUsageMap = new Map();
        
        for (const customization of allCustomizations) {
            if (customization.arTemplateData && customization.arTemplateData.templateIndex !== undefined) {
                const templateIndex = customization.arTemplateData.templateIndex;
                const templateName = customization.arTemplateData.templateName || `Template ${templateIndex}`;
                
                console.log(`Template ${templateIndex}: templateName = "${customization.arTemplateData.templateName}", final = "${templateName}"`);
                
                if (!templateUsageMap.has(templateIndex)) {
                    templateUsageMap.set(templateIndex, {
                        templateIndex: templateIndex,
                        templateName: templateName,
                        usageCount: 0
                    });
                }
                
                const templateData = templateUsageMap.get(templateIndex);
                templateData.usageCount += 1;
            }
        }

        // Convert to array and sort by usage
        const popularTemplates = Array.from(templateUsageMap.values())
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, parseInt(limit));

        console.log('Popular AR templates:', popularTemplates);

        return success_response(res, 200, "Most popular AR templates fetched successfully", popularTemplates);
    } catch (error) {
        console.log('Error in getMostPopularARExperiences:', error);
        return error_response(res, 500, error.message);
    }
};

// Database-based counter for website visitors (persistent)
// Helper function to get or create counter document
const getOrCreateCounter = async () => {
    try {
        let counter = await Counter.findOne({ type: 'website_stats' });
        if (!counter) {
            counter = new Counter({
                type: 'website_stats',
                totalVisits: 0,
                uniqueVisitors: 0
            });
            await counter.save();
            console.log('Created new website stats counter');
        }
        return counter;
    } catch (error) {
        console.log('Error getting/creating counter:', error);
        return null;
    }
};

// Endpoint to increment visitor counters
exports.incrementVisitorCount = async (req, res) => {
    try {
        console.log('=== INCREMENT VISITOR COUNT ENDPOINT CALLED ===');
        console.log('Request body:', req.body);
        
        const { isUniqueVisitor = false } = req.body;
        
        // Get or create counter document
        const counter = await getOrCreateCounter();
        if (!counter) {
            console.log('Failed to get or create counter');
            return error_response(res, 500, 'Failed to access counter');
        }
        
        console.log('Current counter before update:', {
            totalVisits: counter.totalVisits,
            uniqueVisitors: counter.uniqueVisitors
        });
        
        // Always increment total visits
        counter.totalVisits += 1;
        
        // Increment unique visitors if specified
        if (isUniqueVisitor) {
            counter.uniqueVisitors += 1;
            console.log('Incremented unique visitors');
        }
        
        // Update last updated timestamp
        counter.lastUpdated = new Date();
        
        // Save to database
        await counter.save();
        
        console.log(`✅ Visitor count updated - Total: ${counter.totalVisits}, Unique: ${counter.uniqueVisitors}`);
        
        return success_response(res, 200, "Visitor count updated", {
            totalVisits: counter.totalVisits,
            uniqueVisitors: counter.uniqueVisitors
        });
    } catch (error) {
        console.log('❌ Error incrementing visitor count:', error);
        return error_response(res, 500, error.message);
    }
};

// Get website traffic statistics
exports.getWebsiteTrafficStats = async (req, res) => {
    try {
        const { timeframe = 'all' } = req.query;
        
        let dateFilter = {};
        if (timeframe !== 'all') {
            const days = parseInt(timeframe);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            dateFilter = { createdAt: { $gte: startDate } };
        }

        // Get counters from database
        const counter = await getOrCreateCounter();
        const totalVisitors = counter ? counter.uniqueVisitors : 0;
        const totalPageViews = counter ? counter.totalVisits : 0;
        
        // Total registered users (still from database)
        const totalRegisteredUsers = await User.countDocuments(dateFilter);
        
        // Verified vs unverified users
        const verifiedUsers = await User.countDocuments({ isVerified: true, ...dateFilter });
        const unverifiedUsers = await User.countDocuments({ isVerified: false, ...dateFilter });
        
        // Login method distribution
        const manualLoginUsers = await User.countDocuments({ loginMethod: 'manual', ...dateFilter });
        const googleLoginUsers = await User.countDocuments({ loginMethod: 'google', ...dateFilter });
        
        // Buyers (users who have made transactions)
        const buyers = await TransactionData.distinct('user_id', dateFilter);
        const totalBuyers = buyers.length;
        
        // Conversion rate
        const conversionRate = totalRegisteredUsers > 0 ? (totalBuyers / totalRegisteredUsers * 100).toFixed(2) : 0;

        const trafficStats = {
            totalVisitors, // Estimated unique visitors from page views
            totalPageViews, // Total page views
            totalRegisteredUsers, // Total registered users
            // estimatedUniqueVisitors, // Same as totalVisitors for clarity
            verifiedUsers,
            unverifiedUsers,
            manualLoginUsers,
            googleLoginUsers,
            totalBuyers,
            conversionRate: parseFloat(conversionRate)
        };

        return success_response(res, 200, "Website traffic statistics fetched successfully", trafficStats);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

// Get order statistics
exports.getOrderStats = async (req, res) => {
    try {
        const { timeframe = 'all' } = req.query;
        
        let dateFilter = {};
        if (timeframe !== 'all') {
            const days = parseInt(timeframe);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            dateFilter = { createdAt: { $gte: startDate } };
        }

        // Total orders
        const totalOrders = await TransactionData.countDocuments(dateFilter);
        
        // Orders by shipping status using the new isShipped field
        const shippedOrders = await TransactionData.countDocuments({ 
            isShipped: true, 
            ...dateFilter 
        });
        
        // Pending shipping orders
        const pendingShippingOrders = await TransactionData.countDocuments({ 
            isShipped: false, 
            ...dateFilter 
        });
        
        // Standard shipping orders (non-express)
        const standardShippingOrders = await TransactionData.countDocuments({ 
            expressShipping: false, 
            ...dateFilter 
        });
        
        // Revenue statistics - using all transactions since they are all completed when created
        const revenueStats = await TransactionData.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    averageOrderValue: { $avg: '$total' },
                    totalQuantity: { $sum: '$quantity' }
                }
            }
        ]);

        // Express shipping usage
        const expressShippingOrders = await TransactionData.countDocuments({ 
            expressShipping: true, 
            ...dateFilter 
        });
        
        const expressShippingRate = totalOrders > 0 ? (expressShippingOrders / totalOrders * 100).toFixed(2) : 0;
        const shippingCompletionRate = totalOrders > 0 ? (shippedOrders / totalOrders * 100).toFixed(2) : 0;

        // Recent orders
        const recentOrders = await TransactionData.find(dateFilter)
            .populate('user_id', 'firstName lastName email')
            .populate({
                path: 'cardCustomizationId',
                populate: {
                    path: 'cardId',
                    select: 'title price'
                }
            })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('title total status createdAt expressShipping');

        const orderStats = {
            totalOrders,
            shippedOrders,
            pendingShippingOrders,
            standardShippingOrders,
            expressShippingOrders,
            expressShippingRate: parseFloat(expressShippingRate),
            shippingCompletionRate: parseFloat(shippingCompletionRate),
            revenue: revenueStats[0] || { totalRevenue: 0, averageOrderValue: 0, totalQuantity: 0 },
            recentOrders
        };

        return success_response(res, 200, "Order statistics fetched successfully", orderStats);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

// Get comprehensive dashboard statistics
// exports.getDashboardStats = async (req, res) => {
//     try {
//         const { timeframe = '30' } = req.query;
        
//         let dateFilter = {};
//         if (timeframe !== 'all') {
//             const days = parseInt(timeframe);
//             const startDate = new Date();
//             startDate.setDate(startDate.getDate() - days);
//             dateFilter = { createdAt: { $gte: startDate } };
//         }

//         // Get all statistics in parallel
//         const [
//             totalUsers,
//             totalCards,
//             totalTransactions,
//             totalRevenue,
//             totalCustomizations,
//             contactMessages,
//             popularCards,
//             recentTransactions
//         ] = await Promise.all([
//             User.countDocuments(dateFilter),
//             Card.countDocuments({ deleteCard: false, ...dateFilter }),
//             TransactionData.countDocuments(dateFilter),
//             TransactionData.aggregate([
//                 { $match: dateFilter },
//                 { $group: { _id: null, total: { $sum: '$total' } } }
//             ]),
//             CardCustomization.countDocuments({ deleteMyCard: false, ...dateFilter }),
//             ContactUs.countDocuments(dateFilter),
//             Card.find({ deleteCard: false })
//                 .select('title views price')
//                 .sort({ views: -1 })
//                 .limit(5),
//             TransactionData.find(dateFilter)
//                 .populate('user_id', 'firstName lastName email')
//                 .sort({ createdAt: -1 })
//                 .limit(5)
//                 .select('title total status createdAt')
//         ]);

//         const dashboardStats = {
//             overview: {
//                 totalUsers,
//                 totalCards,
//                 totalTransactions,
//                 totalRevenue: totalRevenue[0]?.total || 0,
//                 totalCustomizations,
//                 // contactMessages
//             },
//             popularCards,
//             // recentTransactions,
//             // timeframe: `${timeframe} days`
//         };

//         return success_response(res, 200, "Dashboard statistics fetched successfully", dashboardStats);
//     } catch (error) {
//         console.log(error);
//         return error_response(res, 500, error.message);
//     }
// };

// Get popular cards for filtering based on actual sales
exports.getPopularCards = async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        
        console.log('=== ANALYZING TOP SELLING CARDS FOR FILTER ===');
        
        // Get all transactions
        const allTransactions = await TransactionData.find({});
        console.log('Total completed transactions:', allTransactions.length);
        
        if (allTransactions.length === 0) {
            console.log('No sales data available - returning empty result');
            return success_response(res, 200, "No sales data available for popular cards", []);
        }

        // Analyze sales data to find top selling cards
        const cardSalesMap = new Map();
        
        for (const transaction of allTransactions) {
            try {
                // Find the card customization
                const customization = await CardCustomization.findById(transaction.cardCustomizationId);
                
                if (customization) {
                    // Find the actual card
                    const card = await Card.findById(customization.cardId);
                    
                    if (card && !card.deleteCard) {
                        const cardId = card._id.toString();
                        
                        // Initialize card data if not exists
                        if (!cardSalesMap.has(cardId)) {
                            cardSalesMap.set(cardId, {
                                _id: card._id,
                                title: card.title,
                                price: card.price,
                                cardType: card.cardType,
                                frontDesign: card.frontDesign,
                                views: card.views,
                                totalSales: 0,           // Total revenue from sales
                                totalQuantitySold: 0,    // Total units sold
                                salesCount: 0            // Number of times sold
                            });
                        }
                        
                        // Update sales data
                        const cardData = cardSalesMap.get(cardId);
                        cardData.totalSales += transaction.total;
                        cardData.totalQuantitySold += transaction.quantity;
                        cardData.salesCount += 1;
                    }
                }
            } catch (error) {
                console.log('Error processing transaction:', error.message);
            }
        }
        
        // Convert to array and sort by sales performance
        const allCardSales = Array.from(cardSalesMap.values());
        console.log('Cards with sales data:', allCardSales.length);
        
        // Sort by total sales revenue (most selling first)
        const topSellingCards = allCardSales
            .sort((a, b) => b.totalSales - a.totalSales)
            .slice(0, parseInt(limit));

        console.log('Top selling cards:', topSellingCards.length);
        
        // Log sales data for debugging
        topSellingCards.forEach((card, index) => {
            console.log(`${index + 1}. ${card.title}: $${card.totalSales} revenue, ${card.totalQuantitySold} units, ${card.salesCount} sales`);
        });

        return success_response(res, 200, "Top selling cards fetched successfully", topSellingCards);
    } catch (error) {
        console.log('Error in getPopularCards:', error);
        return error_response(res, 500, error.message);
    }
};

// Get popular AR experience cards
exports.getPopularARExperienceCards = async (req, res) => {
    try {
        const { limit = 50 } = req.query;
        
        console.log('=== ANALYZING AR TEMPLATE USAGE FOR CARDS ===');
        
        // Get all card customizations with AR template data
        const allCustomizations = await CardCustomization.find({
            deleteMyCard: false,
            'arTemplateData.templateIndex': { $exists: true }
        });

        console.log('Total AR customizations found:', allCustomizations.length);

        if (allCustomizations.length === 0) {
            console.log('No AR customizations found - returning empty result');
            return success_response(res, 200, "No AR customizations available for popular AR experience cards", []);
        }

        // Analyze template usage per card
        const cardTemplateUsageMap = new Map();
        
        for (const customization of allCustomizations) {
            if (customization.arTemplateData && customization.arTemplateData.templateIndex !== undefined) {
                const cardId = customization.cardId.toString();
                
                if (!cardTemplateUsageMap.has(cardId)) {
                    cardTemplateUsageMap.set(cardId, {
                        cardId: cardId,
                        usageCount: 0
                    });
                }
                
                const cardData = cardTemplateUsageMap.get(cardId);
                cardData.usageCount += 1;
            }
        }

        // Get cards with their AR usage data
        const cardsWithARUsage = await Card.find({ deleteCard: false })
            .select('_id title views price cardType frontDesign')
            .limit(parseInt(limit));

        // Add AR usage data to cards
        const cardsWithARData = cardsWithARUsage.map(card => {
            const arUsage = cardTemplateUsageMap.get(card._id.toString());
            return {
                ...card.toObject(),
                arUsageCount: arUsage ? arUsage.usageCount : 0
            };
        });

        // Sort by AR usage count (most popular AR experience first)
        const popularARCards = cardsWithARData
            .sort((a, b) => b.arUsageCount - a.arUsageCount)
            .filter(card => card.arUsageCount > 0); // Only show cards with AR usage

        console.log('Popular AR experience cards:', popularARCards.length);

        return success_response(res, 200, "Popular AR experience cards fetched successfully", popularARCards);
    } catch (error) {
        console.log('Error in getPopularARExperienceCards:', error);
        return error_response(res, 500, error.message);
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
      const { timeframe = '30' } = req.query;
  
      // === Date filter setup ===
      let dateFilter = {};
      if (timeframe !== 'all') {
        const days = parseInt(timeframe);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        dateFilter = { createdAt: { $gte: startDate } };
      }
  
      const customizationColl = CardCustomization.collection.name;
      const cardColl = Card.collection.name;
  
      // === Run all queries in parallel ===
      const [
        totalUsers,
        totalCards,
        totalTransactions,
        totalRevenue,
        totalCustomizations,
        contactMessages,
        popularCards,
        recentTransactions,
        popularArTemplates,
        pendingOrders
      ] = await Promise.all([
        User.countDocuments(dateFilter),
        Card.countDocuments({ deleteCard: false, ...dateFilter }),
        TransactionData.countDocuments(dateFilter),
        TransactionData.aggregate([
          { $match: dateFilter },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ]),
        CardCustomization.countDocuments({ deleteMyCard: false, ...dateFilter }),
        ContactUs.countDocuments(dateFilter),
  
        // ✅ Popular cards based on actual sales
        TransactionData.aggregate([
          { $match: dateFilter },
          {
            $lookup: {
              from: customizationColl,
              localField: 'cardCustomizationId',
              foreignField: '_id',
              as: 'cust'
            }
          },
          { $unwind: '$cust' },
          {
            $lookup: {
              from: cardColl,
              localField: 'cust.cardId',
              foreignField: '_id',
              as: 'card'
            }
          },
          { $unwind: '$card' },
          { $match: { 'card.deleteCard': { $ne: true } } },
          {
            $group: {
              _id: '$card._id',
              title: { $first: '$card.title' },
              price: { $first: '$card.price' },
              frontDesign: { $first: '$card.frontDesign' },   // 👈 added
              views: { $first: { $ifNull: ['$card.views', 0] } },
              salesCount: { $sum: 1 },
              totalQuantitySold: { $sum: { $ifNull: ['$quantity', 0] } },
              totalRevenue: { $sum: { $ifNull: ['$total', 0] } }
            }
          },
          { $sort: { totalQuantitySold: -1, salesCount: -1 } },
          { $limit: 1 }
        ]),
  
        // Recent transactions
        TransactionData.find(dateFilter)
          .populate('user_id', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .limit(5)
          .select('title total status createdAt'),

        // Popular AR templates
        (async () => {
          try {
            console.log('=== ANALYZING AR TEMPLATE USAGE IN DASHBOARD ===');
            
            // Get all card customizations with AR template data
            const allCustomizations = await CardCustomization.find({
              deleteMyCard: false,
              'arTemplateData.templateIndex': { $exists: true },
              ...dateFilter
            });

            console.log('Total AR customizations found:', allCustomizations.length);

            // Analyze template usage
            const templateUsageMap = new Map();
            
            for (const customization of allCustomizations) {
              if (customization.arTemplateData && customization.arTemplateData.templateIndex !== undefined) {
                const templateIndex = customization.arTemplateData.templateIndex;
                const templateName = customization.arTemplateData.templateName;
                
                console.log(`Dashboard - Template ${templateIndex}: templateName = "${customization.arTemplateData.templateName}", final = "${templateName}"`);
                
                if (!templateUsageMap.has(templateIndex)) {
                  templateUsageMap.set(templateIndex, {
                    templateIndex: templateIndex,
                    templateName: templateName,
                    usageCount: 0
                  });
                }
                
                const templateData = templateUsageMap.get(templateIndex);
                templateData.usageCount += 1;
              }
            }

            // Convert to array and sort by usage
            const popularTemplates = Array.from(templateUsageMap.values())
              .sort((a, b) => b.usageCount - a.usageCount)
              .slice(0, 1); // Get only the most popular

            console.log('Popular AR templates in dashboard:', popularTemplates);
            return popularTemplates;
          } catch (error) {
            console.log('Error analyzing AR templates in dashboard:', error);
            return [];
          }
        })(),
        // Pending orders (not shipped)
        TransactionData.countDocuments({ 
          isShipped: false, 
          ...dateFilter 
        })
      ]);
  
      // === Format dashboard stats ===
      const dashboardStats = {
        overview: {
          totalUsers,
          totalCards,
          totalTransactions,
          totalRevenue: totalRevenue[0]?.total || 0,
          totalVisitors: (await getOrCreateCounter())?.uniqueVisitors || 0, // Use database counter
          contactMessages,
          pendingOrders
        },
        popularCards,        // ✅ now includes frontDesign
        popularArTemplates,  // ✅ AR template data
        recentTransactions,
        timeframe: `${timeframe} days`
      };
  
      return success_response(res, 200, "Dashboard statistics fetched successfully", dashboardStats);
    } catch (error) {
      console.log(error);
      return error_response(res, 500, error.message);
    }
  };
  
  


// Get revenue analytics
exports.getRevenueAnalytics = async (req, res) => {
    try {
        const { timeframe = '30' } = req.query;
        
        let dateFilter = {};
        if (timeframe !== 'all') {
            const days = parseInt(timeframe);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            dateFilter = { createdAt: { $gte: startDate } };
        }

        // Daily revenue for the last 30 days
        const dailyRevenue = await TransactionData.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // Revenue by card type
        const revenueByCard = await TransactionData.aggregate([
            { $match: dateFilter },
            {
                $lookup: {
                    from: 'cardcustomizations',
                    localField: 'cardCustomizationId',
                    foreignField: '_id',
                    as: 'customization'
                }
            },
            { $unwind: '$customization' },
            {
                $lookup: {
                    from: 'cards',
                    localField: 'customization.cardId',
                    foreignField: '_id',
                    as: 'card'
                }
            },
            { $unwind: '$card' },
            {
                $group: {
                    _id: '$card.title',
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        const revenueAnalytics = {
            dailyRevenue,
            revenueByCard,
            timeframe: `${timeframe} days`
        };

        return success_response(res, 200, "Revenue analytics fetched successfully", revenueAnalytics);
    } catch (error) {
        console.log(error);
        return error_response(res, 500, error.message);
    }
};

// Get top buying users
exports.getTopBuyingUsers = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    console.log('=== ANALYZING TOP BUYING USERS ===');
    
    // Get all transactions and group by user
    const userPurchaseMap = new Map();
    
    const allTransactions = await TransactionData.find({});
    console.log('Total transactions found:', allTransactions.length);
    
    for (const transaction of allTransactions) {
      const userId = transaction.user_id?.toString();
      if (userId) {
        if (!userPurchaseMap.has(userId)) {
          userPurchaseMap.set(userId, {
            userId: userId,
            totalPurchases: 0,
            totalSpent: 0,
            totalCards: 0,
            transactionCount: 0
          });
        }
        
        const userData = userPurchaseMap.get(userId);
        userData.totalPurchases += 1;
        userData.totalSpent += transaction.total || 0;
        userData.totalCards += transaction.quantity || 0;
        userData.transactionCount += 1;
      }
    }
    
    // Get user details for top buyers
    const topBuyers = Array.from(userPurchaseMap.values())
      .sort((a, b) => b.totalCards - a.totalCards)
      .slice(0, parseInt(limit));
    
    // Get user information for top buyers
    const topBuyersWithDetails = [];
    for (const buyer of topBuyers) {
      try {
        const user = await User.findById(buyer.userId);
        if (user) {
          topBuyersWithDetails.push({
            ...buyer,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone
          });
        }
      } catch (error) {
        console.log('Error fetching user details:', error.message);
      }
    }
    
    console.log('Top buying users:', topBuyersWithDetails.length);
    
    return success_response(res, 200, "Top buying users fetched successfully", topBuyersWithDetails);
    
  } catch (error) {
    console.log('Error in getTopBuyingUsers:', error);
    return error_response(res, 500, error.message);
  }
};
