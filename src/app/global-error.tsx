'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center px-4">
            <div className="mb-8">
              <h1 className="text-6xl font-bold text-red-500">Error</h1>
            </div>
            
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Terjadi Kesalahan
              </h2>
              <p className="text-gray-600 mb-4">
                Maaf, terjadi kesalahan yang tidak terduga.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={reset}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Coba Lagi
              </button>
            </div>

            <div className="mt-8 text-gray-400">
              <p className="text-sm">Sistema Akuntansi</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}