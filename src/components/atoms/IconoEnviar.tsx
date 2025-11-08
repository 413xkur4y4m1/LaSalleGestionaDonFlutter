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
      strokeWidth={2.5}
      fill="#ecf0f1"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.5}
    >
      <ellipse cx={155} cy={60} rx={15} ry={6} fill="#bdc3c7" />
      <path d="M 140 60 L 140 70 Q 140 73 143 73 L 167 73 Q 170 73 170 70 L 170 60 Z" />
      <line x1={155} y1={54} x2={155} y2={48} strokeWidth={2} />
      <circle cx={155} cy={46} r={3} fill="#e74c3c" />
      <circle cx={150} cy={62} r={2} fill="#34495e" />
      <circle cx={160} cy={62} r={2} fill="#34495e" />
    </g>
    <g stroke="#3498db" strokeWidth={3} fill="#fff" strokeLinejoin="round">
      <rect x={50} y={90} width={70} height={50} rx={3} fill="#ecf0f1" />
      <path d="M 50 90 L 85 115 L 120 90" fill="#3498db" opacity={0.8} />
      <line x1={50} y1={140} x2={85} y2={115} stroke="#3498db" />
      <line x1={120} y1={140} x2={85} y2={115} stroke="#3498db" />
    </g>
    <g
      stroke="#7f8c8d"
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      opacity={0.6}
    >
      <ellipse cx={75} cy={122} rx={8} ry={3} fill="#95a5a6" />
      <line x1={83} y1={122} x2={90} y2={122} />
      <line x1={95} y1={120} x2={95} y2={130} strokeWidth={1.5} />
      <line x1={93} y1={120} x2={93} y2={123} strokeWidth={1.5} />
      <line x1={97} y1={120} x2={97} y2={123} strokeWidth={1.5} />
      <ellipse cx={107} cy={127} rx={2.5} ry={3} fill="#95a5a6" />
      <line x1={107} y1={124} x2={107} y2={120} strokeWidth={1.5} />
    </g>
    <g
      stroke="#e74c3c"
      strokeWidth={3.5}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 120 100 Q 140 75 150 60" strokeDasharray="5,5" opacity={0.6}>
        <animate
          attributeName="stroke-dashoffset"
          values="0;-20;0"
          dur="2s"
          repeatCount="indefinite"
        />
      </path>
      <g transform="translate(135, 80) rotate(-45)">
        <path
          d="M 0 0 L -8 -3 L 0 -6 L 8 -3 Z"
          fill="#e74c3c"
          stroke="#c0392b"
          strokeWidth={2}
        />
        <line x1={0} y1={0} x2={0} y2={-6} stroke="#c0392b" strokeWidth={1.5} />
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 15,-15; 0,0"
          dur="2s"
          repeatCount="indefinite"
          additive="sum"
        />
      </g>
    </g>
    <g
      stroke="#27ae60"
      strokeWidth={3}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx={85}
        cy={155}
        r={12}
        fill="#2ecc71"
        opacity={0.3}
        stroke="#27ae60"
      />
      <path d="M 80 155 L 90 155" stroke="#fff" strokeWidth={2.5} />
      <path d="M 90 155 L 86 152" stroke="#fff" strokeWidth={2.5} />
      <path d="M 90 155 L 86 158" stroke="#fff" strokeWidth={2.5} />
    </g>
    <g fill="#3498db" opacity={0.6}>
      <circle cx={125} cy={95} r={2}>
        <animate
          attributeName="opacity"
          values="0.6;0;0.6"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={132} cy={88} r={2}>
        <animate
          attributeName="opacity"
          values="0.6;0;0.6"
          dur="1.5s"
          begin="0.3s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={140} cy={82} r={2}>
        <animate
          attributeName="opacity"
          values="0.6;0;0.6"
          dur="1.5s"
          begin="0.6s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={148} cy={72} r={2}>
        <animate
          attributeName="opacity"
          values="0.6;0;0.6"
          dur="1.5s"
          begin="0.9s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
    <g stroke="#3498db" strokeWidth={2} strokeLinecap="round" opacity={0.3}>
      <line x1={115} y1={105} x2={105} y2={110}>
        <animate
          attributeName="opacity"
          values="0.3;0;0.3"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </line>
      <line x1={122} y1={98} x2={112} y2={103}>
        <animate
          attributeName="opacity"
          values="0.3;0;0.3"
          dur="1.5s"
          begin="0.3s"
          repeatCount="indefinite"
        />
      </line>
    </g>
    <g stroke="#95a5a6" strokeWidth={2} fill="#fff" opacity={0.4}>
      <ellipse cx={70} cy={75} rx={15} ry={10} />
      <path d="M 60 80 L 55 85 L 65 82 Z" fill="#fff" stroke="#95a5a6" />
      <circle cx={65} cy={75} r={1.5} fill="#95a5a6" />
      <circle cx={70} cy={75} r={1.5} fill="#95a5a6" />
      <circle cx={75} cy={75} r={1.5} fill="#95a5a6" />
    </g>
  </svg>
);
export default SVGComponent;
