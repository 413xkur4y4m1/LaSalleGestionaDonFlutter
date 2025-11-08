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
    <g stroke="#7f8c8d" strokeWidth={2} fill="none" strokeLinecap="round">
      <line x1={100} y1={20} x2={100} y2={45} />
      <circle cx={100} cy={45} r={3} fill="#7f8c8d" />
    </g>
    <g stroke="#e74c3c" strokeWidth={3} fill="#ffebee" strokeLinejoin="round">
      <path d="M 60 50 L 140 50 L 140 140 Q 100 150 60 140 Z" />
      <circle
        cx={100}
        cy={60}
        r={5}
        fill="#fff"
        stroke="#e74c3c"
        strokeWidth={2}
      />
    </g>
    <g stroke="#34495e" strokeWidth={2.5} fill="none" strokeLinecap="round">
      <path
        d="M 70 90 Q 70 100 75 105 L 110 105 Q 115 100 115 90 Z"
        fill="#95a5a6"
        opacity={0.7}
      />
      <path d="M 115 95 L 130 95" />
      <circle cx={132} cy={95} r={3} fill="#34495e" />
    </g>
    <g
      stroke="#e74c3c"
      strokeWidth={3.5}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 100 115 L 100 135" strokeWidth={3} />
      <path d="M 92 120 L 108 120 Q 110 120 110 125 Q 110 128 105 128 L 95 128" />
      <path d="M 95 128 Q 90 128 90 133 Q 90 136 95 136 L 108 136" />
    </g>
    <g stroke="#e67e22" strokeWidth={2.5} fill="none" strokeLinecap="round">
      <path d="M 130 115 L 135 125 L 125 125 Z" fill="#f39c12" opacity={0.8} />
      <line x1={130} y1={118} x2={130} y2={122} stroke="#fff" strokeWidth={2} />
      <circle cx={130} cy={124} r={0.8} fill="#fff" />
      <circle
        cx={130}
        cy={120}
        r={12}
        stroke="#e67e22"
        strokeWidth={2}
        opacity={0}
      >
        <animate
          attributeName="r"
          values="12;18;12"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.6;0;0.6"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
    <g stroke="#c0392b" strokeWidth={2} strokeLinecap="round" opacity={0.4}>
      <line x1={70} y1={75} x2={95} y2={75} />
      <line x1={105} y1={75} x2={125} y2={75} />
    </g>
    <g
      stroke="#95a5a6"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      opacity={0.6}
    >
      <circle cx={75} cy={120} r={8} />
      <line x1={75} y1={120} x2={75} y2={115} />
      <line x1={75} y1={120} x2={78} y2={122} />
    </g>
  </svg>
);
export default SVGComponent;
