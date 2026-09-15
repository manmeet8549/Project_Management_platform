# Graph Report - .  (2026-09-15)

## Corpus Check
- Corpus is ~43,670 words - fits in a single context window. You may not need a graph.

## Summary
- 435 nodes · 707 edges · 28 communities (22 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Module Cluster 0|Module Cluster 0]]
- [[_COMMUNITY_Module Cluster 1|Module Cluster 1]]
- [[_COMMUNITY_Module Cluster 2|Module Cluster 2]]
- [[_COMMUNITY_Module Cluster 3|Module Cluster 3]]
- [[_COMMUNITY_Module Cluster 4|Module Cluster 4]]
- [[_COMMUNITY_Module Cluster 5|Module Cluster 5]]
- [[_COMMUNITY_Module Cluster 6|Module Cluster 6]]
- [[_COMMUNITY_Module Cluster 7|Module Cluster 7]]
- [[_COMMUNITY_Module Cluster 8|Module Cluster 8]]
- [[_COMMUNITY_Module Cluster 9|Module Cluster 9]]
- [[_COMMUNITY_Module Cluster 10|Module Cluster 10]]
- [[_COMMUNITY_Module Cluster 11|Module Cluster 11]]
- [[_COMMUNITY_Module Cluster 12|Module Cluster 12]]
- [[_COMMUNITY_Module Cluster 13|Module Cluster 13]]
- [[_COMMUNITY_Module Cluster 14|Module Cluster 14]]
- [[_COMMUNITY_Module Cluster 15|Module Cluster 15]]
- [[_COMMUNITY_Module Cluster 16|Module Cluster 16]]
- [[_COMMUNITY_Module Cluster 17|Module Cluster 17]]
- [[_COMMUNITY_Module Cluster 18|Module Cluster 18]]
- [[_COMMUNITY_Module Cluster 19|Module Cluster 19]]
- [[_COMMUNITY_Module Cluster 20|Module Cluster 20]]
- [[_COMMUNITY_Module Cluster 21|Module Cluster 21]]
- [[_COMMUNITY_Module Cluster 22|Module Cluster 22]]
- [[_COMMUNITY_Module Cluster 25|Module Cluster 25]]
- [[_COMMUNITY_Module Cluster 26|Module Cluster 26]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 88 edges
2. `DatabaseStore` - 30 edges
3. `compilerOptions` - 16 edges
4. `db` - 13 edges
5. `successResponse()` - 12 edges
6. `apiHandler()` - 12 edges
7. `validateBody()` - 10 edges
8. `useAuth()` - 9 edges
9. `NotFoundError` - 9 edges
10. `AppError` - 8 edges

## Surprising Connections (you probably didn't know these)
- `DashboardCard()` --calls--> `cn()`  [EXTRACTED]
  src/app/dashboard/page.tsx → src/lib/utils.ts
- `ProjectDetailsPage()` --calls--> `cn()`  [EXTRACTED]
  src/app/projects/[id]/page.tsx → src/lib/utils.ts
- `SettingsPage()` --calls--> `cn()`  [EXTRACTED]
  src/app/settings/page.tsx → src/lib/utils.ts
- `IconContainer()` --calls--> `cn()`  [EXTRACTED]
  src/components/layout/FloatingDock.tsx → src/lib/utils.ts
- `Avatar()` --calls--> `cn()`  [EXTRACTED]
  src/components/ui/avatar.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (28 total, 6 thin omitted)

### Community 0 - "Module Cluster 0"
Cohesion: 0.05
Nodes (59): env, envSchema, db, AppError, BadRequestError, ConflictError, errorResponse(), FieldErrorDetail (+51 more)

### Community 1 - "Module Cluster 1"
Cohesion: 0.07
Nodes (31): AiCopilotWindow(), AiCopilotWindowProps, ImportedTask, Message, geistMono, geistSans, metadata, AuthContext (+23 more)

### Community 2 - "Module Cluster 2"
Cohesion: 0.07
Nodes (26): apiCache, CacheItem, MemoryCacheStore, ChatMessage, cleanJsonString(), extractTasksFallback(), POST(), CredentialField (+18 more)

### Community 4 - "Module Cluster 4"
Cohesion: 0.09
Nodes (22): devDependencies, eslint, eslint-config-next, @eslint/eslintrc, prisma, @prisma/client, tailwindcss, @tailwindcss/postcss (+14 more)

### Community 5 - "Module Cluster 5"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 6 - "Module Cluster 6"
Cohesion: 0.11
Nodes (16): CredentialField, CredentialItem, NoteItem, ProjectDetailsPage(), RawProjectApiDetail, RawTaskApiDetail, EditTaskModal(), EditTaskModalProps (+8 more)

### Community 7 - "Module Cluster 7"
Cohesion: 0.18
Nodes (18): cn(), Card(), CardAction(), CardContent(), CardDescription(), CardFooter(), CardHeader(), CardTitle() (+10 more)

### Community 8 - "Module Cluster 8"
Cohesion: 0.10
Nodes (20): dependencies, @base-ui/react, bcryptjs, class-variance-authority, clsx, date-fns, framer-motion, jsonwebtoken (+12 more)

### Community 9 - "Module Cluster 9"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 10 - "Module Cluster 10"
Cohesion: 0.12
Nodes (9): DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem(), DropdownMenuSeparator(), DropdownMenuShortcut(), DropdownMenuSubContent() (+1 more)

### Community 11 - "Module Cluster 11"
Cohesion: 0.24
Nodes (5): Features(), FinalCTA(), Hero(), PainPoints(), PublicHeader()

### Community 12 - "Module Cluster 12"
Cohesion: 0.17
Nodes (4): SettingsPage(), Input(), Textarea(), TooltipContent()

### Community 13 - "Module Cluster 13"
Cohesion: 0.18
Nodes (6): DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogTitle()

### Community 14 - "Module Cluster 14"
Cohesion: 0.18
Nodes (6): SheetContent(), SheetDescription(), SheetFooter(), SheetHeader(), SheetOverlay(), SheetTitle()

### Community 15 - "Module Cluster 15"
Cohesion: 0.29
Nodes (6): Avatar(), AvatarBadge(), AvatarFallback(), AvatarGroup(), AvatarGroupCount(), AvatarImage()

### Community 16 - "Module Cluster 16"
Cohesion: 0.33
Nodes (3): EndpointPreset, PRESET_ENDPOINTS, TestResult

### Community 17 - "Module Cluster 17"
Cohesion: 0.60
Nodes (4): Button(), buttonVariants, Calendar(), CalendarDayButton()

### Community 18 - "Module Cluster 18"
Cohesion: 0.40
Nodes (5): Tabs(), TabsContent(), TabsList(), tabsListVariants, TabsTrigger()

### Community 19 - "Module Cluster 19"
Cohesion: 0.40
Nodes (4): compat, __dirname, eslintConfig, __filename

## Knowledge Gaps
- **166 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+161 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Module Cluster 7` to `Module Cluster 1`, `Module Cluster 6`, `Module Cluster 10`, `Module Cluster 11`, `Module Cluster 12`, `Module Cluster 13`, `Module Cluster 14`, `Module Cluster 15`, `Module Cluster 17`, `Module Cluster 18`, `Module Cluster 20`, `Module Cluster 22`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._
- **Why does `DatabaseStore` connect `Module Cluster 3` to `Module Cluster 2`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Module Cluster 8` to `Module Cluster 4`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _166 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Module Cluster 0` be split into smaller, more focused modules?**
  _Cohesion score 0.050200803212851405 - nodes in this community are weakly interconnected._
- **Should `Module Cluster 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06938020351526364 - nodes in this community are weakly interconnected._
- **Should `Module Cluster 2` be split into smaller, more focused modules?**
  _Cohesion score 0.06951871657754011 - nodes in this community are weakly interconnected._