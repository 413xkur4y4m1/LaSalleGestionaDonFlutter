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
      fill="#ecf0f1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 70 100 L 70 135 Q 70 145 80 145 L 120 145 Q 130 145 130 135 L 130 100 Z" />
      <ellipse
        cx={100}
        cy={100}
        rx={30}
        ry={10}
        fill="#bdc3c7"
        stroke="#34495e"
      />
      <line x1={100} y1={90} x2={100} y2={75} strokeWidth={2.5} />
      <circle
        cx={100}
        cy={72}
        r={5}
        fill="#e74c3c"
        stroke="#34495e"
        strokeWidth={2}
      >
        <animate
          attributeName="fill"
          values="#e74c3c;#3498db;#e74c3c"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
      <path d="M 70 110 Q 55 110 50 115" strokeWidth={2.5} />
      <circle
        cx={48}
        cy={117}
        r={4}
        fill="#95a5a6"
        stroke="#34495e"
        strokeWidth={2}
      />
      <path d="M 130 110 Q 145 110 150 115" strokeWidth={2.5} />
      <circle
        cx={152}
        cy={117}
        r={4}
        fill="#95a5a6"
        stroke="#34495e"
        strokeWidth={2}
      />
    </g>
    <g>
      <circle cx={90} cy={102} r={4} fill="#34495e">
        <animate
          attributeName="r"
          values="4;1;4"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={110} cy={102} r={4} fill="#34495e">
        <animate
          attributeName="r"
          values="4;1;4"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>
      <path
        d="M 88 112 Q 100 118 112 112"
        stroke="#34495e"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
    </g>
    <g stroke="#7f8c8d" strokeWidth={1.5} fill="none" opacity={0.4}>
      <line x1={85} y1={125} x2={85} y2={135} />
      <line x1={83} y1={125} x2={83} y2={128} />
      <line x1={87} y1={125} x2={87} y2={128} />
      <ellipse cx={100} cy={130} rx={3} ry={4} />
      <line x1={100} y1={126} x2={100} y2={120} />
    </g>
    <g stroke="#3498db" strokeWidth={3} fill="#fff" strokeLinejoin="round">
      <path d="M 110 50 L 170 50 Q 180 50 180 60 L 180 85 Q 180 95 170 95 L 125 95 L 115 105 L 118 95 L 110 95 Q 100 95 100 85 L 100 60 Q 100 50 110 50 Z" />
    </g>
    <g fill="#3498db">
      <circle cx={125} cy={72} r={4}>
        <animate
          attributeName="opacity"
          values="0.3;1;0.3"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={140} cy={72} r={4}>
        <animate
          attributeName="opacity"
          values="0.3;1;0.3"
          dur="1.5s"
          begin="0.3s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={155} cy={72} r={4}>
        <animate
          attributeName="opacity"
          values="0.3;1;0.3"
          dur="1.5s"
          begin="0.6s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
    <g
      stroke="#3498db"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      opacity={0.5}
    >
      <path d="M 75 85 Q 70 85 65 88">
        <animate
          attributeName="opacity"
          values="0.5;0;0.5"
          dur="2s"
          repeatCount="indefinite"
        />
      </path>
      <path d="M 75 95 Q 68 95 62 99">
        <animate
          attributeName="opacity"
          values="0.5;0;0.5"
          dur="2s"
          begin="0.4s"
          repeatCount="indefinite"
        />
      </path>
      <path d="M 75 105 Q 67 105 60 110">
        <animate
          attributeName="opacity"
          values="0.5;0;0.5"
          dur="2s"
          begin="0.8s"
          repeatCount="indefinite"
        />
      </path>
    </g>
    <g stroke="#9b59b6" strokeWidth={1.5} fill="none" opacity={0.3}>
      <circle cx={165} cy={60} r={6} />
      <line x1={165} y1={54} x2={165} y2={50} />
      <line x1={171} y1={60} x2={175} y2={60} />
      <line x1={159} y1={60} x2={155} y2={60} />
    </g>
    <g fill="#95a5a6" stroke="#34495e" strokeWidth={2}>
      <rect x={85} y={145} width={12} height={8} rx={2} />
      <rect x={103} y={145} width={12} height={8} rx={2} />
    </g>
  </svg>
);
export default SVGComponent;
