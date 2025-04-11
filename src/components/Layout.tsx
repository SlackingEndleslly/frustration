
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const Layout = ({ children, title }: LayoutProps) => {
  return (
    <div className="rage-container">
      {title && (
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center text-white drop-shadow-[0_2px_4px_rgba(217,70,239,0.6)]">
          {title}
        </h1>
      )}
      {children}
    </div>
  );
};

export default Layout;
