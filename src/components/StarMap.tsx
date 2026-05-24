import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Goal } from "../types";

interface StarMapProps {
  goals: Goal[];
  onSelectGoal?: (goal: Goal) => void;
}

export default function StarMap({ goals, onSelectGoal }: StarMapProps) {
  const centerX = 400;
  const centerY = 300;
  const orbitRadius = 220;

  const nodes = useMemo(() => {
    const count = Math.max(goals.length, 1);
    return goals.map((goal, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const x = centerX + Math.cos(angle) * orbitRadius;
      const y = centerY + Math.sin(angle) * orbitRadius;
      return { ...goal, x, y, angle };
    });
  }, [goals]);

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <svg
        viewBox="0 0 800 600"
        className="w-full h-full max-w-4xl max-h-[600px]"
        style={{ filter: "drop-shadow(0 0 40px rgba(0,217,255,0.05))" }}
      >
        {/* Background orbit rings */}
        {[1, 0.7, 0.4].map((scale, i) => (
          <circle
            key={i}
            cx={centerX}
            cy={centerY}
            r={orbitRadius * scale}
            fill="none"
            stroke="rgba(0,217,255,0.04)"
            strokeWidth={1}
            strokeDasharray={i === 2 ? "4 8" : "none"}
          />
        ))}

        {/* Connection lines between goals */}
        {nodes.map((node, i) => {
          const next = nodes[(i + 1) % nodes.length];
          return (
            <line
              key={`line-${node.id}`}
              x1={node.x}
              y1={node.y}
              x2={next.x}
              y2={next.y}
              stroke="rgba(0,217,255,0.08)"
              strokeWidth={1}
            />
          );
        })}

        {/* Goal nodes */}
        {nodes.map((node, i) => {
          const color = node.color_theme || "#00D9FF";
          const progress = node.current_progress_pct || 0;
          const radius = 28;
          const circumference = 2 * Math.PI * (radius + 6);
          const progressOffset = circumference - (progress / 100) * circumference;

          return (
            <g
              key={node.id}
              onClick={() => onSelectGoal?.(node)}
              style={{ cursor: "pointer" }}
            >
              {/* Energy ring background */}
              <circle
                cx={node.x}
                cy={node.y}
                r={radius + 6}
                fill="none"
                stroke={`${color}15`}
                strokeWidth={4}
              />

              {/* Energy ring progress */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={radius + 6}
                fill="none"
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: progressOffset }}
                transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.1 }}
                style={{
                  filter: `drop-shadow(0 0 6px ${color}60)`,
                  transformOrigin: `${node.x}px ${node.y}px`,
                  transform: "rotate(-90deg)",
                }}
              />

              {/* Node body */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={radius}
                fill={`${color}18`}
                stroke={color}
                strokeWidth={1.5}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: i * 0.08, type: "spring" }}
                style={{
                  filter: `drop-shadow(0 0 12px ${color}30)`,
                }}
              />

              {/* Inner pulse dot */}
              <circle
                cx={node.x}
                cy={node.y}
                r={4}
                fill={color}
                opacity={0.8}
              >
                <animate
                  attributeName="opacity"
                  values="0.4;1;0.4"
                  dur="3s"
                  repeatCount="indefinite"
                  begin={`${i * 0.5}s`}
                />
              </circle>

              {/* Label */}
              <text
                x={node.x}
                y={node.y + radius + 22}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize={12}
                fontWeight={500}
              >
                {node.name.length > 8 ? node.name.slice(0, 8) + "..." : node.name}
              </text>

              {/* Progress text */}
              <text
                x={node.x}
                y={node.y + radius + 36}
                textAnchor="middle"
                fill={color}
                fontSize={10}
                opacity={0.7}
              >
                {progress}%
              </text>
            </g>
          );
        })}

        {/* Center core */}
        <g>
          <circle
            cx={centerX}
            cy={centerY}
            r={40}
            fill="none"
            stroke="rgba(0,217,255,0.1)"
            strokeWidth={1}
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={32}
            fill="rgba(0,217,255,0.08)"
            stroke="rgba(0,217,255,0.3)"
            strokeWidth={1.5}
            style={{ filter: "drop-shadow(0 0 20px rgba(0,217,255,0.2))" }}
          />
          <circle cx={centerX} cy={centerY} r={6} fill="#00D9FF">
            <animate
              attributeName="r"
              values="4;7;4"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.6;1;0.6"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <text
            x={centerX}
            y={centerY + 48}
            textAnchor="middle"
            fill="#00D9FF"
            fontSize={11}
            opacity={0.6}
          >
            指挥核心
          </text>
        </g>

        {/* Decorative stars */}
        {Array.from({ length: 30 }).map((_, i) => {
          const x = Math.random() * 800;
          const y = Math.random() * 600;
          const size = Math.random() * 1.5 + 0.5;
          const opacity = Math.random() * 0.4 + 0.1;
          return (
            <circle
              key={`star-${i}`}
              cx={x}
              cy={y}
              r={size}
              fill="#ffffff"
              opacity={opacity}
            >
              <animate
                attributeName="opacity"
                values={`${opacity};${opacity * 0.3};${opacity}`}
                dur={`${Math.random() * 3 + 2}s`}
                repeatCount="indefinite"
              />
            </circle>
          );
        })}
      </svg>
    </div>
  );
}
