<script lang="ts">
  import * as Card from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button";
  import { Badge } from "$lib/components/ui/badge";
  import { Avatar, AvatarFallback } from "$lib/components/ui/avatar";
  import ExternalLinkIcon from "@lucide/svelte/icons/external-link";
  import TrendingUpIcon from "@lucide/svelte/icons/trending-up";

  const sources = [
    {
      id: 1,
      name: "Wikipedia",
      domain: "en.wikipedia.org",
      citations: 1690,
      trend: 12.5,
      category: "Encyclopedia",
      url: "https://wikipedia.org",
      authority: 95,
    },
    {
      id: 2,
      name: "Medium",
      domain: "medium.com",
      citations: 1153,
      trend: 8.3,
      category: "Blog",
      url: "https://medium.com",
      authority: 88,
    },
    {
      id: 3,
      name: "AWS",
      domain: "aws.amazon.com",
      citations: 1115,
      trend: -2.1,
      category: "Documentation",
      url: "https://aws.amazon.com",
      authority: 92,
    },
    {
      id: 4,
      name: "Google Cloud",
      domain: "cloud.google.com",
      citations: 908,
      trend: 15.7,
      category: "Documentation",
      url: "https://cloud.google.com",
      authority: 90,
    },
    {
      id: 5,
      name: "Stack Overflow",
      domain: "stackoverflow.com",
      citations: 765,
      trend: 5.2,
      category: "Q&A",
      url: "https://stackoverflow.com",
      authority: 87,
    },
  ];

  function formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  }

  function getCategoryColor(category: string) {
    const colors: Record<string, string> = {
      Encyclopedia:
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      Blog: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      Documentation:
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "Q&A":
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    };
    return (
      colors[category] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
    );
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold tracking-tight">Sources</h2>
      <p class="text-muted-foreground">
        Most cited sources referencing your brand
      </p>
    </div>
    <Button variant="outline">Export Sources</Button>
  </div>

  <div class="grid gap-6">
    {#each sources as source}
      <Card.Root>
        <Card.Content class="py-6">
          <div class="flex items-start gap-6">
            <Avatar class="h-12 w-12">
              <AvatarFallback class="text-lg bg-primary/10">
                {source.name.substring(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div class="flex-1 space-y-4">
              <div class="flex items-start justify-between">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <h3 class="text-lg font-semibold">{source.name}</h3>
                    <Badge class={getCategoryColor(source.category)}>
                      {source.category}
                    </Badge>
                  </div>
                  <p class="text-sm text-muted-foreground">{source.domain}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  href={source.url}
                  target="_blank"
                >
                  <ExternalLinkIcon class="h-4 w-4" />
                </Button>
              </div>

              <div class="grid grid-cols-3 gap-4">
                <div class="space-y-1">
                  <p class="text-xs text-muted-foreground">Citations</p>
                  <p class="text-2xl font-bold">
                    {formatNumber(source.citations)}
                  </p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs text-muted-foreground">Trend</p>
                  <div class="flex items-center gap-1">
                    <TrendingUpIcon
                      class="h-4 w-4 {source.trend > 0
                        ? 'text-green-600'
                        : 'text-red-600'}"
                    />
                    <p
                      class="text-lg font-semibold {source.trend > 0
                        ? 'text-green-600'
                        : 'text-red-600'}"
                    >
                      {source.trend > 0 ? "+" : ""}{source.trend}%
                    </p>
                  </div>
                </div>
                <div class="space-y-1">
                  <p class="text-xs text-muted-foreground">Authority</p>
                  <div class="flex items-center gap-2">
                    <div class="flex-1">
                      <div class="w-full bg-secondary rounded-full h-2">
                        <div
                          class="bg-primary rounded-full h-2"
                          style="width: {source.authority}%"
                        ></div>
                      </div>
                    </div>
                    <p class="text-sm font-semibold">{source.authority}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card.Content>
      </Card.Root>
    {/each}
  </div>
</div>
