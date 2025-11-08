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
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M 70 90 L 70 120 Q 70 130 80 130 L 120 130 Q 130 130 130 120 L 130 90 Z"
        fill="#ecf0f1"
        stroke="#34495e"
      />
      <ellipse
        cx={100}
        cy={90}
        rx={30}
        ry={8}
        fill="#bdc3c7"
        stroke="#34495e"
      />
      <ellipse cx={100} cy={82} rx={8} ry={4} fill="#95a5a6" stroke="#34495e" />
      <path d="M 65 100 Q 55 100 55 110" strokeWidth={2.5} />
      <path d="M 135 100 Q 145 100 145 110" strokeWidth={2.5} />
    </g>
    <g
      stroke="#e74c3c"
      strokeWidth={4}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 40 60 Q 100 20 160 60" />
      <path d="M 160 60 L 150 55" />
      <path d="M 160 60 L 155 70" />
    </g>
    <g
      stroke="#3498db"
      strokeWidth={4}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 160 150 Q 100 190 40 150" />
      <path d="M 40 150 L 50 145" />
      <path d="M 40 150 L 45 160" />
    </g>
    <g stroke="#7f8c8d" strokeWidth={2} fill="none" opacity={0.6}>
      <circle cx={25} cy={100} r={6} fill="#7f8c8d" />
      <path d="M 25 106 L 25 120 M 18 112 L 32 112" strokeLinecap="round" />
      <circle cx={175} cy={100} r={6} fill="#7f8c8d" />
      <path d="M 175 106 L 175 120 M 168 112 L 182 112" strokeLinecap="round" />
    </g>
  </svg>
);
export default SVGComponent;
