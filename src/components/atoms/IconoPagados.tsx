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
    <g stroke="#27ae60" strokeWidth={3} fill="#e8f8f5" strokeLinejoin="round">
      <path d="M 60 50 L 140 50 L 140 140 Q 100 150 60 140 Z" />
      <circle
        cx={100}
        cy={60}
        r={5}
        fill="#fff"
        stroke="#27ae60"
        strokeWidth={2}
      />
    </g>
    <g stroke="#34495e" strokeWidth={2.5} fill="none" strokeLinecap="round">
      <path
        d="M 70 85 Q 70 95 75 100 L 110 100 Q 115 95 115 85 Z"
        fill="#95a5a6"
        opacity={0.7}
      />
      <path d="M 115 90 L 130 90" />
      <circle cx={132} cy={90} r={3} fill="#34495e" />
    </g>
    <g
      stroke="#27ae60"
      strokeWidth={5}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 75 125 L 90 140 L 125 105">
        <animate
          attributeName="stroke-dasharray"
          values="0,100;100,0"
          dur="0.8s"
          fill="freeze"
        />
        <animate
          attributeName="stroke-dashoffset"
          values="100;0"
          dur="0.8s"
          fill="freeze"
        />
      </path>
    </g>
    <g stroke="#27ae60" strokeWidth={3} fill="none">
      <circle cx={100} cy={125} r={30} opacity={0.3} />
    </g>
    <g
      stroke="#27ae60"
      strokeWidth={2}
      fill="none"
      opacity={0.5}
      strokeLinecap="round"
    >
      <line x1={70} y1={72} x2={95} y2={72} />
      <line x1={105} y1={72} x2={125} y2={72} />
    </g>
    <g stroke="#2ecc71" strokeWidth={2} fill="#2ecc71" opacity={0.6}>
      <path d="M 65 115 L 67 120 L 62 120 Z">
        <animate
          attributeName="opacity"
          values="0.6;0.2;0.6"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </path>
      <path d="M 135 115 L 137 120 L 132 120 Z">
        <animate
          attributeName="opacity"
          values="0.6;0.2;0.6"
          dur="1.5s"
          begin="0.5s"
          repeatCount="indefinite"
        />
      </path>
      <path d="M 100 155 L 102 160 L 97 160 Z">
        <animate
          attributeName="opacity"
          values="0.6;0.2;0.6"
          dur="1.5s"
          begin="1s"
          repeatCount="indefinite"
        />
      </path>
    </g>
    <g
      stroke="#2ecc71"
      strokeWidth={2.5}
      fill="none"
      strokeLinecap="round"
      opacity={0.4}
    >
      <line x1={130} y1={125} x2={140} y2={125}>
        <animate
          attributeName="opacity"
          values="0;0.7;0"
          dur="2s"
          repeatCount="indefinite"
        />
      </line>
      <line x1={135} y1={120} x2={142} y2={113}>
        <animate
          attributeName="opacity"
          values="0;0.7;0"
          dur="2s"
          begin="0.3s"
          repeatCount="indefinite"
        />
      </line>
      <line x1={135} y1={130} x2={142} y2={137}>
        <animate
          attributeName="opacity"
          values="0;0.7;0"
          dur="2s"
          begin="0.6s"
          repeatCount="indefinite"
        />
      </line>
    </g>
  </svg>
);
export default SVGComponent;
