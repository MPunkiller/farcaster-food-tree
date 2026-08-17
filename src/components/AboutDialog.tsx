import guide from "@/assets/guide.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FARCASTER_URL, GITHUB_URL, ROOT_CAST_URL } from "@/lib/constants";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>About this project</DialogTitle>
          <DialogDescription>
            This is an interactive reconstruction of the quote-cast tree growing from Czar&apos;s
            Farcaster post.
          </DialogDescription>
        </DialogHeader>

        <img
          src={guide}
          alt="Illustrated guide to the Food Quote-Cast Tree"
          className="w-full rounded-xl border border-border"
        />

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Every node is a real cast. An arrow points from a cast to the casts that quoted it, so
            the shape of the tree is the shape of the conversation.
          </p>
          <p>
            Data is fetched at request time through a server-side Farcaster data endpoint — nothing
            is hardcoded and no wallet, account, or sign-in is required. Because the API cannot
            prove exhaustiveness, the tree is presented as a live reconstruction.
          </p>
          <p>
            Profile locations shown in the details panel are self-declared by each Farcaster user.
            They are not birthplaces or hometowns.
          </p>
          <ul className="space-y-1 text-sm">
            <li>
              <a
                className="text-primary underline-offset-4 hover:underline"
                href={ROOT_CAST_URL}
                target="_blank"
                rel="noreferrer noopener"
              >
                Root cast on Farcaster
              </a>
            </li>
            <li>
              <a
                className="text-primary underline-offset-4 hover:underline"
                href={FARCASTER_URL}
                target="_blank"
                rel="noreferrer noopener"
              >
                Farcaster
              </a>
            </li>
            {GITHUB_URL ? (
              <li>
                <a
                  className="text-primary underline-offset-4 hover:underline"
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Source on GitHub
                </a>
              </li>
            ) : (
              <li className="text-xs">Source repository link: configure in src/lib/constants.ts</li>
            )}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
