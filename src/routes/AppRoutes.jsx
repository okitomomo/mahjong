import { HashRouter, Routes, Route } from "react-router-dom";
import { Layout } from "../components/Layout.jsx";
import TopPage from "../pages/TopPage.jsx";
import { RoomListPage } from "../pages/RoomListPage.jsx";
import { RoomDetailPage } from "../pages/RoomDetailPage.jsx";
import { GameInputPage } from "../pages/GameInputPage.jsx";
import { TestPage } from "../pages/TestPage.jsx";
import { NotFoundPage } from "../pages/NotFoundPage.jsx";

export default function AppRoute() {
    return (
        <HashRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<TopPage />} />
                    <Route path="/rooms" element={<RoomListPage />} />
                    <Route path="/rooms/:roomId" element={<RoomDetailPage />} />
                    <Route path="/rooms/:roomId/game/new" element={<GameInputPage />} />
                    <Route path="/test" element={<TestPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Layout>
        </HashRouter>
    );
}
