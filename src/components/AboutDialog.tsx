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

        <Tabs defaultValue="overview" className="w-full min-w-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="guess" className="text-xs sm:text-sm">
              Location Guess
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3">
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
          </TabsContent>

          <TabsContent value="guess" className="space-y-3 text-sm text-muted-foreground">
            <h3 className="text-sm font-semibold text-foreground">Location Guess</h3>
            <p>
              A small interactive game built from the self-declared locations available in Farcaster
              profiles.
            </p>
            <p className="font-medium text-foreground">How it works</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>A poster with a valid self-declared location is selected.</li>
              <li>Their food image, profile picture, and username are shown.</li>
              <li>The game asks: &ldquo;Where do you think they&apos;re from?&rdquo;</li>
              <li>The actual location is hidden while the player makes their guess.</li>
              <li>The player taps anywhere on the map to place their guess.</li>
              <li>The game reveals the poster&apos;s self-declared location.</li>
              <li>A line is drawn between the player&apos;s guess and the actual location.</li>
              <li>The game calculates the real distance between the two points.</li>
              <li>The player receives a score based on how close their guess was.</li>
              <li>Players can continue through multiple rounds and receive a final score.</li>
            </ol>
            <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
              Location is self-declared profile data. It is not necessarily the poster&apos;s
              birthplace, hometown, or where the food photo was taken.
            </p>
            <p className="text-xs">
              Profiles without usable self-declared location coordinates are never used as game
              rounds.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
