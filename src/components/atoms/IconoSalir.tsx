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
      stroke="#34495e"
      strokeWidth={3}
      fill="#95a5a6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse
        cx={100}
        cy={80}
        rx={40}
        ry={15}
        fill="#7f8c8d"
        transform="rotate(-15 100 80)"
      />
      <path
        d="M 65 75 Q 60 90 65 100 L 125 110 Q 130 100 128 85 Z"
        fill="#95a5a6"
        stroke="#34495e"
      />
      <line
        x1={128}
        y1={88}
        x2={155}
        y2={95}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <circle
        cx={157}
        cy={96}
        r={4}
        fill="#7f8c8d"
        stroke="#34495e"
        strokeWidth={2}
      />
      <path
        d="M 68 78 Q 95 85 125 88"
        stroke="#5d6d7e"
        strokeWidth={2}
        fill="none"
      />
    </g>
    <g>
      <ellipse
        cx={55}
        cy={120}
        rx={12}
        ry={15}
        fill="#fff"
        stroke="#34495e"
        strokeWidth={2.5}
      >
        <animate
          attributeName="cy"
          values="120;145;120"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="1;0.3;1"
          dur="2s"
          repeatCount="indefinite"
        />
      </ellipse>
      <circle
        cx={55}
        cy={120}
        r={6}
        fill="#f39c12"
        stroke="#e67e22"
        strokeWidth={2}
      >
        <animate
          attributeName="cy"
          values="120;145;120"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="1;0.3;1"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={52} cy={118} r={2} fill="#fff" opacity={0.8}>
        <animate
          attributeName="cy"
          values="118;143;118"
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.8;0.2;0.8"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
    <g
      stroke="#e74c3c"
      strokeWidth={4}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 80 130 Q 70 135 60 145" strokeWidth={4}>
        <animate
          attributeName="opacity"
          values="0.8;0.4;0.8"
          dur="2s"
          repeatCount="indefinite"
        />
      </path>
      <path d="M 60 145 L 65 140" strokeWidth={4}>
        <animate
          attributeName="opacity"
          values="0.8;0.4;0.8"
          dur="2s"
          repeatCount="indefinite"
        />
      </path>
      <path d="M 60 145 L 55 142" strokeWidth={4}>
        <animate
          attributeName="opacity"
          values="0.8;0.4;0.8"
          dur="2s"
          repeatCount="indefinite"
        />
      </path>
    </g>
    <g
      stroke="#bdc3c7"
      strokeWidth={2}
      strokeLinecap="round"
      strokeDasharray="3,3"
      opacity={0.5}
    >
      <line x1={55} y1={110} x2={55} y2={155}>
        <animate
          attributeName="stroke-dashoffset"
          values="0;10;0"
          dur="1s"
          repeatCount="indefinite"
        />
      </line>
    </g>
    <g fill="#fff" opacity={0.6}>
      <circle cx={48} cy={105} r={2}>
        <animate
          attributeName="cy"
          values="105;130;105"
          dur="2s"
          begin="0.2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.6;0;0.6"
          dur="2s"
          begin="0.2s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={62} cy={108} r={1.5}>
        <animate
          attributeName="cy"
          values="108;133;108"
          dur="2s"
          begin="0.5s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.6;0;0.6"
          dur="2s"
          begin="0.5s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
    <g stroke="#e74c3c" strokeWidth={2.5} strokeLinecap="round" opacity={0.7}>
      <line x1={45} y1={155} x2={35} y2={165} />
    </g>
    <g stroke="#95a5a6" strokeWidth={2} strokeLinecap="round" opacity={0.3}>
      <line x1={25} y1={175} x2={65} y2={175} />
    </g>
  </svg>
);
export default SVGComponent;
