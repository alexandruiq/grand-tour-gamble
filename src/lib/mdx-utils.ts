// Client-side safe markdown utilities
export function getMarkdownContent(filePath: string) {
  // For now, return placeholder content
  // In production, this would fetch from API or be pre-rendered
  return {
    metadata: {},
    content: ''
  }
}

export function getCyclistBackstory(cyclistRole: 'luca' | 'jonas' | 'mateo' | 'kenji') {
  // Static backstories for now - in production would load from markdown
  const backstories = {
    luca: `Luca Moretti — "The Prodigy Who Never Peaked"

They said he would be the next great Italian rider — the reincarnation of Coppi or Pantani. But fame came too fast, too early. A few junior trophies, a front-page Giro crash, and Luca vanished. Years later, he's back — grizzled, bitter, brilliant. This is his second chance, and in his mind, it's now or never.

Assigned to Team Rubicon, Luca knows he's not here to play second fiddle. He respects the team, of course, but deep down, this Tour isn't about synergy — it's about redemption. The world has forgotten his name, but he's ready to make them remember. One perfect breakaway. One unstoppable surge. That's all it will take.`,

    jonas: `Jonas Dahl — "The Domestique Turned Dissident"

For a decade, Jonas poured sweat and strategy into other riders' victories. He gave up breakaways, sabotaged his own time trials, and kept captains safe from wind and harm. But after a betrayal in his final Tour, he retired quietly… or so they thought.

This time, with Team Rubicon, things are different. There's no one to protect — no one to lead out. This is his turn to be the tip of the spear. Jonas won't waste energy on sentiment. He sees the Grand Tour Gamble as a strategic puzzle — and he plans to win it, move by calculated move.`,

    mateo: `Mateo Silva — "The Wildcard With a Chip on His Shoulder"

Mateo never fit the mold — Brazilian, working-class, cocky, and always clashing with coaches. He won races not by numbers but by intuition and guts. After being dropped by two teams for insubordination, he vanished into underground street cycling. That's where they found him.

Team Rubicon might be structured, but Mateo sees the Gamble as a stage for something bigger. Not just points or podiums — legacy. If he times it right, this will be the ride that silences the haters and makes him a legend.`,

    kenji: `Kenji Nakamura — "The Strategist With Something to Prove"

Kenji was the analyst everyone wanted on their team — calculating, composed, always two moves ahead. But after a public feud with a famous team manager, he left pro cycling and turned to game design and AI modeling. The Grand Tour Gamble intrigued him not for glory, but for the pure logic of it.

Joining Team Rubicon, he's prepared to play the long game — quietly biding his time until the moment is right. He sees the Gamble as a perfect setup: controlled chaos, ripe for disruption. This isn't about teamwork; this is a personal equation, and Kenji plans to solve it with precision and perfect timing.`
  }
  
  return backstories[cyclistRole] || 'A skilled cyclist ready to compete in The Grand Tour Gamble.'
}

export function getGameRules() {
  // Static rules content for now
  return {
    metadata: {},
    content: `# The Grand Tour Gamble — Complete Rules 🚴‍♂️

Welcome to **The Grand Tour Gamble**, where your team manages cyclists in the prestigious Team Rubicon. Over 10 challenging stages, you'll make strategic decisions that impact both individual performance and team success.

## 🎯 Game Objectives

### Individual Goals
- **Maximize your cyclist's total points** across all 10 stages
- **Manage stamina strategically** — it's a finite resource that determines your options
- **Balance risk vs. reward** in each stage decision

### Team Goals
- **Team Rubicon must outscore rival teams**: Solaris, Corex, and Vortex
- **Coordinate during negotiation phases** for bonus multipliers
- **Support team synergy** to unlock stamina recovery bonuses

---

## 🕹️ Core Game Mechanics

### Stage Decisions
Every stage, each cyclist must choose:

**🚀 Sprint Decision**
- **Effect**: Push hard for maximum points
- **Cost**: -1 stamina point
- **Risk**: If stamina = 0, sprint is **blocked** (frontend prevents selection)
- **Reward**: Higher point potential, competitive advantage

**🛡️ Cruise Decision**
- **Effect**: Ride conservatively, preserve energy
- **Benefit**: +1 stamina recovery (when team synergy is good)
- **Strategy**: Safer option, builds toward future sprint opportunities
- **Team Play**: Supports overall team coordination

---

## 💪 Stamina Management System

### Starting Conditions
- **Each cyclist begins with 5 stamina points**
- **Stamina is visible** to you and your trainer throughout the game

### Stamina Rules
- **Sprinting**: Costs 1 stamina point immediately
- **No Stamina Sprint Block**: Cannot sprint with 0 stamina (enforced by UI)
- **Cruising**: Restores +1 stamina **only when team synergy is high**
- **Maximum Stamina**: Cannot exceed 5 points

### Strategic Considerations
- **Early Game**: Build momentum with strategic sprints
- **Mid Game**: Balance stamina for negotiation stages
- **End Game**: Time your final stamina spend for maximum impact

---

## 🤝 Negotiation Phases

### Negotiation Timing
Critical team coordination happens before:
- **Stage 4** (Mountain Pass) — x3 points multiplier
- **Stage 7** (Forest Trail) — x5 points multiplier  
- **Stage 10** (Grand Finale) — x10 points multiplier

### Alignment Bonuses
When 3+ cyclists choose the same decision:
- **Decision multiplier applied** to all aligned cyclists
- **Stage 4**: 3x points for aligned decisions
- **Stage 7**: 5x points for aligned decisions
- **Stage 10**: 10x points for aligned decisions

### Negotiation Strategy
- **Communication is key** — discuss your stamina levels openly
- **Plan 2-3 stages ahead** — consider stamina recovery needs
- **Balance individual and team goals** — sometimes sacrifice for team benefit
- **Watch rival teams** — anticipate their strategies

---

## 🏆 Scoring & Victory

### Individual Scoring
- **Points vary by stage** and decision type
- **Multipliers apply** during negotiation stages
- **Final individual score** = sum of all stage points

### Team Scoring
- **Team Rubicon total** = sum of all 4 cyclists' scores
- **Victory condition**: Highest team total after Stage 10
- **Rival teams**: Solaris, Corex, Vortex (AI-controlled)

### End Game
- **Stage 10 is decisive** — 10x multiplier makes final coordination crucial
- **Debrief available** after completion with full performance analysis
- **Individual and team rankings** determined by final point totals

---

## 🎮 Game Flow Summary

1. **Pre-Game**: Review cyclist backstories and team composition
2. **Stages 1-3**: Individual play, build stamina strategy
3. **Stage 4**: First negotiation + 3x multiplier
4. **Stages 5-6**: Execute coordination plan
5. **Stage 7**: Second negotiation + 5x multiplier  
6. **Stages 8-9**: Final preparation phase
7. **Stage 10**: Ultimate negotiation + 10x multiplier
8. **Post-Game**: Debrief, analysis, and celebration!

---

## 💡 Pro Tips

### Stamina Management
- **Never waste stamina early** — negotiation stages are worth more
- **Cruise strategically** to set up big sprint moments
- **Communicate stamina levels** during negotiations

### Team Strategy
- **Alignment is powerful** — coordinated decisions get massive multipliers
- **Trust your teammates** — individual sacrifices can benefit everyone
- **Think long-term** — Stage 10's 10x multiplier can change everything

### Psychological Elements
- **Read the room** during negotiations
- **Manage risk tolerance** as stamina depletes
- **Stay flexible** — adapt to unexpected team dynamics

---

## 🚨 Important Notes

- **Decisions are final** once submitted for each stage
- **No communication** allowed outside of designated negotiation phases
- **Trainer oversees** all game progression and rule enforcement
- **Real-time updates** show team performance throughout the game

**Good luck, and may the best team win! 🏁**`
  }
}

export function getGameHistory() {
  return getMarkdownContent('doc/02. game_history.md')
}

export function getStageDescription(stageNumber: number) {
  // For now, return a dynamic description based on stage constants
  const stageNames = [
    'The Dawn Sprint',
    'Valley Crossroads', 
    'Cobblestone Challenge',
    'Mountain Pass', // Negotiation
    'Desert Winds',
    'River Crossing',
    'Forest Trail', // Negotiation  
    'Hill Climb',
    'Final Valley', // Negotiation
    'Grand Finale'
  ]
  
  const descriptions = [
    'The race begins with a challenging dawn sprint through rolling hills.',
    'Navigate the tricky valley crossroads where every decision matters.',
    'Test your endurance on the legendary cobblestone challenge.',
    'The first major climb - negotiation and strategy are key.',
    'Battle the relentless desert winds in this endurance stage.',
    'Cross the rushing river while managing your stamina carefully.',
    'Wind through the forest trail where teamwork pays off.',
    'A brutal hill climb that separates the strong from the weak.',
    'The penultimate stage through the final valley before glory.',
    'The grand finale - everything you\'ve worked for comes down to this.'
  ]
  
  return {
    name: stageNames[stageNumber - 1] || `Stage ${stageNumber}`,
    description: descriptions[stageNumber - 1] || `Stage ${stageNumber} description`,
    isNegotiation: [4, 7, 9].includes(stageNumber)
  }
}