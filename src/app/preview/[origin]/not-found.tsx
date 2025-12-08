import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
        <h1 className="mb-2 text-xl font-semibold">Theme Not Found</h1>
        <p className="mb-4 text-muted-foreground">
          This theme doesn&apos;t exist or couldn&apos;t be loaded.
        </p>
        <Button asChild variant="outline">
          <Link href="/market/browse">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Market
          </Link>
        </Button>
      </div>
    </div>
  );
}
