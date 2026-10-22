import type { CSSProperties } from 'react';
import type { IconType } from 'react-icons';
import { FaAws, FaJava, FaMicrosoft } from 'react-icons/fa';
import {
  SiAndroid,
  SiAngular,
  SiApple,
  SiCplusplus,
  SiCss,
  SiDjango,
  SiDocker,
  SiDotnet,
  SiFastapi,
  SiFirebase,
  SiFlask,
  SiFlutter,
  SiGo,
  SiGooglecloud,
  SiGraphql,
  SiHtml5,
  SiJavascript,
  SiKotlin,
  SiKubernetes,
  SiLaravel,
  SiMongodb,
  SiMysql,
  SiNextdotjs,
  SiNodedotjs,
  SiPhp,
  SiPostgresql,
  SiPython,
  SiReact,
  SiRedis,
  SiRuby,
  SiRubyonrails,
  SiRust,
  SiScala,
  SiSharp,
  SiShopify,
  SiSolidity,
  SiSvelte,
  SiSwift,
  SiSymfony,
  SiTailwindcss,
  SiTerraform,
  SiTypescript,
  SiVuedotjs,
  SiWordpress,
} from 'react-icons/si';

const ICONS: Record<string, IconType> = {
  javascript: SiJavascript,
  typescript: SiTypescript,
  react: SiReact,
  'next.js': SiNextdotjs,
  vue: SiVuedotjs,
  angular: SiAngular,
  svelte: SiSvelte,
  'node.js': SiNodedotjs,
  python: SiPython,
  django: SiDjango,
  flask: SiFlask,
  fastapi: SiFastapi,
  ruby: SiRuby,
  rails: SiRubyonrails,
  'ruby on rails': SiRubyonrails,
  go: SiGo,
  golang: SiGo,
  rust: SiRust,
  java: FaJava,
  kotlin: SiKotlin,
  scala: SiScala,
  'c++': SiCplusplus,
  'c#': SiSharp,
  '.net': SiDotnet,
  php: SiPhp,
  laravel: SiLaravel,
  symfony: SiSymfony,
  swift: SiSwift,
  'objective-c': SiApple,
  ios: SiApple,
  android: SiAndroid,
  'react native': SiReact,
  flutter: SiFlutter,
  aws: FaAws,
  gcp: SiGooglecloud,
  azure: FaMicrosoft,
  docker: SiDocker,
  kubernetes: SiKubernetes,
  k8s: SiKubernetes,
  terraform: SiTerraform,
  postgresql: SiPostgresql,
  mysql: SiMysql,
  mongodb: SiMongodb,
  redis: SiRedis,
  graphql: SiGraphql,
  tailwind: SiTailwindcss,
  css: SiCss,
  html: SiHtml5,
  solidity: SiSolidity,
  firebase: SiFirebase,
  wordpress: SiWordpress,
  shopify: SiShopify,
};

export function TechIcon({ tag, className = 'w-3 h-3 shrink-0' }: { tag: string; className?: string }) {
  const Icon = ICONS[tag.toLowerCase()];
  if (!Icon) return null;
  return <Icon className={className} aria-hidden />;
}

export default function TechTag({
  tag,
  className = 'tag-pill',
  style,
}: {
  tag: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={className} style={style}>
      <TechIcon tag={tag} />
      {tag}
    </span>
  );
}
