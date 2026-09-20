import React from "react";
import SidePanel from "./SidePanel.jsx";

// Re-export SidePanel as default Modal so all existing components get the full-height side panel experience
export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  icon,
  badge,
  side = "left",
  maxWidth = "max-w-2xl",
}) => {
  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={icon}
      badge={badge}
      side={side}
      maxWidth={maxWidth}
    >
      {children}
    </SidePanel>
  );
};

export default Modal;
