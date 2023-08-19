import styled, { css, FlattenSimpleInterpolation } from "styled-components";
import yellowButton from "../images/Yelow Button.png";
import grayButton from "../images/grey button.png";
import brightRedButton from "../images/Bright Red Button.jpg";
import greenButton from "../images/green button.png";

type ButtonVariant =
   | "green"
   | "blue"
   | "red"
   | "bright-red"
   | "yellow"
   | "gray";

const variantBackgroundObj: { [k in ButtonVariant]: string } = {
   "bright-red": brightRedButton,
   blue:
      "linear-gradient(90deg, rgba(27,78,136,1) 26%, rgba(20,64,111,1) 46%) !important",
   gray: grayButton,
   red:
      "linear-gradient(101deg, #430e70, #4D3077), #662D91 !important",
   yellow: `url(${yellowButton})`,
   green: "linear-gradient(90deg, #662D91, #4D3077), #662D91 !important",
};

const buttonSizeObj: { [k in ButtonSize]: FlattenSimpleInterpolation } = {
   small: css`
      padding: 5px 0px;
      min-width: 150px;
      background-size: cover;
      background-position: center;
      border-radius: 0px;
      height: 32px;
      display: flex;
      justify-content: center;
      align-items: center;
   `,
   medium: css``,
   large: css``,
};

type ButtonSize = "small" | "medium" | "large";
export default styled.div<{ variant?: ButtonVariant; size?: ButtonSize }>`
   padding: 15px;
   width: 100%;
   height: fit-content;
   text-align: center;
   color: white;
   background-size: cover;
   margin-bottom: 16px;
   background: ${(p) => variantBackgroundObj[p.variant || "gray"]};
   border-radius: 14px;
   box-shadow: 2px 3px 1px rgba(0,0,0,0.4);
   cursor: pointer;
   background-size: cover;
   ${(p) => buttonSizeObj[p.size || "large"]};
`;
