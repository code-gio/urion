<script lang="ts">
  import * as Chart from "$lib/components/ui/chart/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
  import { scaleUtc } from "d3-scale";
  import { Area, AreaChart } from "layerchart";
  import { curveNatural } from "d3-shape";

  let {
    data = [],
  }: {
    data?: Array<{ date: Date; citations: number }>;
  } = $props();

  let timeRange = $state("90d");

  const selectedLabel = $derived.by(() => {
    switch (timeRange) {
      case "90d":
        return "Last 3 months";
      case "30d":
        return "Last 30 days";
      case "7d":
        return "Last 7 days";
      default:
        return "Last 3 months";
    }
  });

  const filteredData = $derived(
    data.filter((item) => {
      const referenceDate = new Date();
      let daysToSubtract = 90;
      if (timeRange === "30d") {
        daysToSubtract = 30;
      } else if (timeRange === "7d") {
        daysToSubtract = 7;
      }
      referenceDate.setDate(referenceDate.getDate() - daysToSubtract);
      return item.date >= referenceDate;
    })
  );

  const chartConfig = {
    citations: { label: "Citation Share", color: "hsl(var(--primary))" },
  } satisfies Chart.ChartConfig;
</script>

<Card.Root class="@container/card">
  <Card.Header>
    <Card.Title>Citation Share</Card.Title>
    <Card.Description>
      <span class="hidden @[540px]/card:block"
        >Your percentage of total citations</span
      >
      <span class="@[540px]/card:hidden">Citation percentage</span>
    </Card.Description>
    <Card.Action>
      <ToggleGroup.Root
        type="single"
        bind:value={timeRange}
        variant="outline"
        class="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
      >
        <ToggleGroup.Item value="90d">Last 3 months</ToggleGroup.Item>
        <ToggleGroup.Item value="30d">Last 30 days</ToggleGroup.Item>
        <ToggleGroup.Item value="7d">Last 7 days</ToggleGroup.Item>
      </ToggleGroup.Root>
      <Select.Root type="single" bind:value={timeRange}>
        <Select.Trigger
          size="sm"
          class="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
          aria-label="Select a value"
        >
          <span data-slot="select-value">
            {selectedLabel}
          </span>
        </Select.Trigger>
        <Select.Content class="rounded-xl">
          <Select.Item value="90d" class="rounded-lg">Last 3 months</Select.Item
          >
          <Select.Item value="30d" class="rounded-lg">Last 30 days</Select.Item>
          <Select.Item value="7d" class="rounded-lg">Last 7 days</Select.Item>
        </Select.Content>
      </Select.Root>
    </Card.Action>
  </Card.Header>
  <Card.Content class="px-2 pt-4 sm:px-6 sm:pt-6">
    <div class="w-full h-[250px]">
      <Chart.Container config={chartConfig} class="aspect-auto h-full w-full">
        <AreaChart
          data={filteredData}
          x="date"
          xScale={scaleUtc()}
          series={[
            {
              key: "citations",
              label: "Citation Share",
              color: chartConfig.citations.color,
            },
          ]}
          props={{
            area: {
              curve: curveNatural,
              "fill-opacity": 0.4,
              line: { class: "stroke-2" },
              motion: "tween",
            },
            xAxis: {
              ticks: timeRange === "7d" ? 7 : undefined,
              format: (v) => {
                return v.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              },
            },
            yAxis: {
              format: (v) => `${v}%`,
              ticks: 5,
            },
          }}
        >
          {#snippet marks({ series, getAreaProps })}
            <defs>
              <linearGradient id="fillCitations" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stop-color="var(--color-citations)"
                  stop-opacity={1.0}
                />
                <stop
                  offset="95%"
                  stop-color="var(--color-citations)"
                  stop-opacity={0.1}
                />
              </linearGradient>
            </defs>
            {#each series as s, i (s.key)}
              <Area {...getAreaProps(s, i)} fill="url(#fillCitations)" />
            {/each}
          {/snippet}
          {#snippet tooltip()}
            <Chart.Tooltip
              labelFormatter={(v: Date) => {
                return v.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
              }}
              formatter={(v) => `${v}%`}
              indicator="line"
            />
          {/snippet}
        </AreaChart>
      </Chart.Container>
    </div>
  </Card.Content>
</Card.Root>
