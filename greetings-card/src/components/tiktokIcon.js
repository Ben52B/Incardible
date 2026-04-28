import { SvgIcon } from "@mui/material";
import { siTiktok } from "simple-icons/icons";

export default function TikTokIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d={siTiktok.path} />
    </SvgIcon>
  );
}
