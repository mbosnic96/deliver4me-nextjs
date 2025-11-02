import { Suspense } from 'react';
import CMSContentDisplay from '@/components/CMSContentDisplay';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={<HomepageSkeleton />}>
        <CMSContentDisplay />
      </Suspense>
    </main>
  );
}

function HomepageSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="h-screen bg-gray-200 animate-pulse"></div>
      
      <div className="container mx-auto px-4 py-16 space-y-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-lg animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}