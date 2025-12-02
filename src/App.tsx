import { useState } from "react";
import { Route, Routes } from "react-router";
import { ChatSidebar } from "~/components/ChatSidebar";
import { SidebarProvider } from "~/components/ui/sidebar";
import ChatPage from "./pages/ChatPage";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex h-screen bg-background w-full">
        <ChatSidebar />
        <Routes>
          <Route path="/thread/:threadId" element={<ChatPage />} />
        </Routes>
      </div>
    </SidebarProvider>
  );
}
