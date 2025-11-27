import * as React from "react";
import { SVGProps } from "react";
const SVGComponent = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200 200"
    width={50}
    height={50}
    {...props}
  >
    <circle cx={100} cy={100} r={95} fill="#2563eb" opacity={0.1} />
    <rect x={45} y={45} width={110} height={110} fill="white" rx={8} />
    <rect x={50} y={50} width={100} height={100} fill="#1e40af" rx={5} />
    <rect x={58} y={58} width={20} height={20} fill="white" rx={2} />
    <rect x={63} y={63} width={10} height={10} fill="#1e40af" />
    <rect x={122} y={58} width={20} height={20} fill="white" rx={2} />
    <rect x={127} y={63} width={10} height={10} fill="#1e40af" />
    <rect x={58} y={122} width={20} height={20} fill="white" rx={2} />
    <rect x={63} y={127} width={10} height={10} fill="#1e40af" />
    <rect x={88} y={60} width={6} height={6} fill="white" />
    <rect x={98} y={60} width={6} height={6} fill="white" />
    <rect x={108} y={60} width={6} height={6} fill="white" />
    <rect x={60} y={88} width={6} height={6} fill="white" />
    <rect x={70} y={88} width={6} height={6} fill="white" />
    <rect x={88} y={88} width={6} height={6} fill="white" />
    <rect x={98} y={88} width={6} height={6} fill="white" />
    <rect x={108} y={88} width={6} height={6} fill="white" />
    <rect x={122} y={88} width={6} height={6} fill="white" />
    <rect x={134} y={88} width={6} height={6} fill="white" />
    <rect x={60} y={98} width={6} height={6} fill="white" />
    <rect x={88} y={98} width={6} height={6} fill="white" />
    <rect x={108} y={98} width={6} height={6} fill="white" />
    <rect x={122} y={98} width={6} height={6} fill="white" />
    <rect x={70} y={108} width={6} height={6} fill="white" />
    <rect x={88} y={108} width={6} height={6} fill="white" />
    <rect x={98} y={108} width={6} height={6} fill="white" />
    <rect x={122} y={108} width={6} height={6} fill="white" />
    <rect x={134} y={108} width={6} height={6} fill="white" />
    <rect x={88} y={122} width={6} height={6} fill="white" />
    <rect x={98} y={122} width={6} height={6} fill="white" />
    <rect x={108} y={122} width={6} height={6} fill="white" />
    <rect x={122} y={134} width={6} height={6} fill="white" />
    <rect x={134} y={134} width={6} height={6} fill="white" />
    <g transform="translate(100, 100)">
      <path d="M -8 -12 L -6 -12 L -6 8 L -8 8 Z" fill="white" />
      <path d="M -8 -12 L -6 -12 L -7 -16 Z" fill="white" />
      <path d="M 2 -12 L 4 -12 L 4 8 L 2 8 Z" fill="white" />
      <path d="M 0 -16 L 2 -16 L 2 -10 L 0 -10 Z" fill="white" />
      <path d="M 4 -16 L 6 -16 L 6 -10 L 4 -10 Z" fill="white" />
      <ellipse cx={11} cy={-14} rx={2.5} ry={3} fill="white" />
      <path d="M 10 -12 L 12 -12 L 11 8 L 10 8 Z" fill="white" />
    </g>
    <circle
      cx={100}
      cy={100}
      r={95}
      fill="none"
      stroke="#2563eb"
      strokeWidth={3}
      opacity={0.3}
    />
  </svg>
);
export default SVGComponent;
