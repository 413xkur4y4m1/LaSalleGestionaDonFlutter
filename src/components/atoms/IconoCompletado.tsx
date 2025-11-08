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
    <g
      stroke="#8e44ad"
      strokeWidth={3}
      fill="#e8daef"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M 60 60 L 140 60 Q 145 60 145 65 L 145 150 Q 145 155 140 155 L 60 155 Q 55 155 55 150 L 55 65 Q 55 60 60 60 Z" />
      <path
        d="M 55 65 L 50 70 L 50 160 L 55 155"
        fill="#d7bde2"
        stroke="#8e44ad"
      />
      <path
        d="M 55 60 L 50 65 L 50 70 L 55 65"
        fill="#c39bd3"
        stroke="#8e44ad"
      />
    </g>
    <g stroke="#e74c3c" strokeWidth={2.5} fill="#e74c3c">
      <path d="M 120 60 L 120 45 L 125 50 L 130 45 L 130 60 Z" opacity={0.8} />
    </g>
    <g stroke="#8e44ad" strokeWidth={2.5} strokeLinecap="round" opacity={0.4}>
      <line x1={70} y1={75} x2={105} y2={75} />
      <line x1={70} y1={85} x2={90} y2={85} />
    </g>
    <g
      stroke="#34495e"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      opacity={0.6}
    >
      <line x1={70} y1={100} x2={70} y2={110} />
      <line x1={68} y1={100} x2={68} y2={105} />
      <line x1={72} y1={100} x2={72} y2={105} />
      <line x1={70} y1={125} x2={70} y2={135} />
      <path d="M 70 125 L 72 123 L 70 121 L 68 123 Z" fill="#95a5a6" />
      <ellipse cx={71} cy={148} rx={4} ry={2} />
      <line x1={67} y1={148} x2={67} y2={153} />
      <line x1={75} y1={148} x2={75} y2={153} />
    </g>
    <g
      stroke="#27ae60"
      strokeWidth={2.5}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 85 98 L 90 103 L 100 93" />
      <path d="M 85 123 L 90 128 L 100 118" />
      <path d="M 85 146 L 90 151 L 100 141" />
    </g>
    <g stroke="#27ae60" strokeWidth={2} fill="none" opacity={0.3}>
      <circle cx={92} cy={98} r={10} />
      <circle cx={92} cy={123} r={10} />
      <circle cx={92} cy={148} r={10} />
    </g>
    <g
      stroke="#7f8c8d"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      opacity={0.5}
    >
      <rect x={115} y={95} width={20} height={20} rx={2} strokeWidth={2} />
      <line x1={118} y1={95} x2={118} y2={92} />
      <line x1={132} y1={95} x2={132} y2={92} />
      <line x1={120} y1={102} x2={128} y2={102} strokeWidth={1.5} />
      <line x1={120} y1={107} x2={125} y2={107} strokeWidth={1.5} />
    </g>
    <g stroke="#8e44ad" strokeWidth={3} fill="none" opacity={0.3}>
      <circle cx={125} cy={135} r={18} />
      <path
        d="M 115 135 L 122 142 L 135 129"
        strokeWidth={3.5}
        stroke="#8e44ad"
      />
    </g>
    <g
      stroke="#9b59b6"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      opacity={0}
    >
      <line x1={145} y1={100} x2={155} y2={100}>
        <animate
          attributeName="opacity"
          values="0;0.5;0"
          dur="3s"
          repeatCount="indefinite"
        />
      </line>
      <line x1={145} y1={110} x2={152} y2={110}>
        <animate
          attributeName="opacity"
          values="0;0.5;0"
          dur="3s"
          begin="0.5s"
          repeatCount="indefinite"
        />
      </line>
    </g>
  </svg>
);
export default SVGComponent;
