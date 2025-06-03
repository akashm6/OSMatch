"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  DiTerminal,
  DiScala,
  DiPython,
  DiReact,
  DiGo,
  DiRuby,
  DiRust,
  DiJsBadge,
  DiMysql,
  DiHtml5,
  DiJava,
  DiGithubBadge,
  DiDart,
  DiCss3,
  DiHaskell,
  DiPhp,
  DiPerl,
  DiSwift,
  DiMarkdown,
  DiPostgresql,
  DiMongodb
} from "react-icons/di";
import {
  SiLua,
  SiCplusplus,
  SiR,
  SiKotlin,
} from "react-icons/si";

const icons = [
  { icon: <DiPython />, className: "text-blue-500" },
  { icon: <DiGo />, className: "text-cyan-400" },
  { icon: <DiJsBadge />, className: "text-yellow-400" },
  { icon: <DiReact />, className: "text-teal-400" },
  { icon: <DiRust />, className: "text-red-400" },
  { icon: <DiMysql />, className: "text-orange-400" },
  { icon: <DiRuby />, className: "text-pink-400" },
  { icon: <DiScala />, className: "text-purple-400" },
  { icon: <DiTerminal />, className: "text-gray-400" },
  { icon: <DiHtml5 />, className: "text-orange-500" },
  { icon: <DiJava />, className: "text-orange-600" },
  { icon: <DiGithubBadge />, className: "text-white" },
  { icon: <DiDart />, className: "text-blue-300" },
  { icon: <DiCss3 />, className: "text-blue-600" },
  { icon: <DiHaskell />, className: "text-indigo-300" },
  { icon: <DiPhp />, className: "text-indigo-500" },
  { icon: <DiPerl />, className: "text-purple-300" },
  { icon: <DiSwift />, className: "text-orange-300" },
  { icon: <DiMarkdown />, className: "text-teal-400" },
  { icon: <DiMongodb />, className: "text-green-300" },
  { icon: <DiPostgresql />, className: "text-blue-400" },
  { icon: <SiLua />, className: "text-blue-800" },
  { icon: <SiCplusplus />, className: "text-blue-400" },
  { icon: <SiR />, className: "text-sky-300" },
  { icon: <SiKotlin />, className: "text-fuchsia-400" },
];

const FloatingIcons = () => {
  const [hasMounted, setHasMounted] = useState(false);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    setHasMounted(true);
    setPositions(
      icons.map(() => ({
        top: `${Math.random() * 80 + 5}vh`,
        left: `${Math.random() * 80 + 5}vw`,
        delay: Math.random() * 4,
        duration: 6 + Math.random() * 4,
      }))
    );
  }, []);

  if (!hasMounted) return null;

  return (
    <>
      {icons.map((item, index) => (
        <motion.div
          key={index}
          className={`absolute text-7xl ${item.className}`}
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0.6, 0], y: [0, -20, 0] }}
          transition={{
            duration: positions[index]?.duration || 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: positions[index]?.delay || 0,
          }}
          style={{
            top: positions[index]?.top || "50vh",
            left: positions[index]?.left || "50vw",
          }}
        >
          {item.icon}
        </motion.div>
      ))}
    </>
  );
};

export default FloatingIcons;
