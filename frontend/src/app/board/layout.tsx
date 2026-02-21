import type { Metadata } from "next";
import "./board.css";

export const metadata: Metadata = {
    title: "BoardyBoo — Whiteboard Session",
    description: "Your AI whiteboard tutoring session.",
};

export default function BoardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
