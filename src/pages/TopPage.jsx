import { Link } from "react-router-dom";

const Top = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 flex items-center justify-center px-4">
            <div className="text-center max-w-sm">
                <div className="mb-6">
                    <div className="text-6xl mb-4">🀄</div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        麻雀戦績管理
                    </h1>
                    <p className="text-sm text-gray-600">
                        半荘のスコアを簡単に記録・管理
                    </p>
                </div>
                <Link
                    to="/rooms"
                    className="block w-full px-6 py-4 bg-blue-600 text-white font-medium rounded-lg active:bg-blue-700 transition-colors shadow-lg"
                >
                    部屋一覧へ
                </Link>
                <p className="mt-4 text-xs text-gray-500">
                  スマートフォンからの利用を推奨
                </p>
            </div>
        </div>
    )
}
export default Top;