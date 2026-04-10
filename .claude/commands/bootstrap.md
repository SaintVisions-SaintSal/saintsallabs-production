# /bootstrap — Scaffold New Module (Platform)

Scaffold a new feature module following SaintSal Labs conventions.

## Usage
`/bootstrap [module-name] [type: page|api|component]`

## Page Scaffold (App Router)
Creates: `src/app/(dashboard)/[module-name]/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ModuleNamePage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground">Module Name</h1>
        {/* content */}
      </div>
    </div>
  );
}
```

## API Route Scaffold
Creates: `src/app/api/[module-name]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    // implementation here

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    console.error('[module-name]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## After Scaffold
- Add new env vars to `.env.example`
- Add Supabase RLS policies if new table
- Add to CLAUDE.md route list
