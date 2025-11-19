export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-gray-50 p-4">
            {children}
        </div>
    );
}