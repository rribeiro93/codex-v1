"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const Upload_1 = __importDefault(require("./upload/Upload"));
const Categories_1 = __importDefault(require("./categories/Categories"));
const Summary_1 = __importDefault(require("./summary/Summary"));
const menuItems = [
    { id: 'upload', label: 'Upload' },
    { id: 'summary', label: 'Resumo' },
    { id: 'categories', label: 'Categorias' }
];
function App() {
    const [activePage, setActivePage] = (0, react_1.useState)('upload');
    const [hoveredItem, setHoveredItem] = (0, react_1.useState)('');
    const renderActivePage = () => {
        if (activePage === 'summary') {
            return (0, jsx_runtime_1.jsx)(Summary_1.default, {});
        }
        if (activePage === 'categories') {
            return (0, jsx_runtime_1.jsx)(Categories_1.default, {});
        }
        return (0, jsx_runtime_1.jsx)(Upload_1.default, {});
    };
    return ((0, jsx_runtime_1.jsxs)("div", { style: styles.app, children: [(0, jsx_runtime_1.jsx)("header", { style: styles.topNav, children: (0, jsx_runtime_1.jsx)("nav", { "aria-label": "Navega\u00E7\u00E3o principal", style: styles.nav, children: (0, jsx_runtime_1.jsx)("ul", { style: styles.navList, children: menuItems.map((item) => {
                            const isActive = item.id === activePage;
                            const isHovered = item.id === hoveredItem;
                            return ((0, jsx_runtime_1.jsx)("li", { children: (0, jsx_runtime_1.jsx)("button", { type: "button", style: {
                                        ...styles.navButton,
                                        ...(isHovered && !isActive ? styles.navButtonHover : null),
                                        ...(isActive ? styles.navButtonActive : null)
                                    }, onClick: () => setActivePage(item.id), onMouseEnter: () => setHoveredItem(item.id), onMouseLeave: () => setHoveredItem(''), onFocus: () => setHoveredItem(item.id), onBlur: () => setHoveredItem(''), children: item.label }) }, item.id));
                        }) }) }) }), (0, jsx_runtime_1.jsx)("main", { style: styles.content, children: renderActivePage() })] }));
}
const styles = {
    app: {
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #293e49 0%, #1f2f37 100%)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: '#f8fafc'
    },
    topNav: {
        position: 'sticky',
        top: 0,
        zIndex: 5,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(9, 14, 24, 0.85)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.25)'
    },
    nav: {
        width: '100%'
    },
    navList: {
        listStyle: 'none',
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        margin: 0,
        padding: 0
    },
    navButton: {
        padding: '0.5rem 1.5rem',
        border: '1px solid transparent',
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        color: '#e2e8f0',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: 600,
        letterSpacing: '0.01em',
        transition: 'background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease'
    },
    navButtonActive: {
        backgroundColor: '#38bdf8',
        color: '#0f172a'
    },
    navButtonHover: {
        backgroundColor: 'rgba(56, 189, 248, 0.2)',
        color: '#f8fafc',
        borderColor: 'rgba(148, 197, 255, 0.45)'
    },
    content: {
        flex: '1 1 auto',
        padding: '3rem',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        overflowY: 'auto'
    }
};
