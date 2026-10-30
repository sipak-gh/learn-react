# Appendix C — Five Dice Rules

The rules of Five Dice as the course's game implements them. The rules come from the
[Five Dice page of Bee's Boards](https://beesboardsma.com/pages/five-dice), which says the game "is played using
the same rules and scoring commonly associated with the game *Yahtzee*". This appendix follows that page and
marks each place where the course made its own decision. The last section maps every rule to the code in
`project/ch20/src/game/` and the tests that check it.

## The game in short

- **Players:** 1 to 4, sharing one device ("hot seat"). They take turns in the order they were entered.
- **Equipment:** five ordinary six-sided dice and a scorecard with 13 boxes.
- **Length:** 13 rounds. In each turn, a player fills exactly one box, so after 13 rounds every box is full.
- **Goal:** the highest total score, bonuses included.

## A turn

The source page describes a turn like this:

1. Roll all five dice.
2. Set aside ("keep") any dice you like.
3. Re-roll the others, up to **two more times**: at most **three rolls** per turn. "You may stop early and score
   at any time."
4. After your last roll, choose **one** box on your scorecard and write your score in it.

Each box can be used only once per game. If your dice don't fit any open box, or you don't want to use a good box
yet, you may score **0** in any open box. You can't skip a turn.

In the app, the Roll button (or Space) rolls the dice. Click a die (or press 1 to 5) to hold it, so the next roll
leaves it alone. After the first roll, every open box on the scorecard shows what it would score; click one to
score it. After the third roll you must score. Then the next player's turn starts with no held dice.

## The scorecard

### Upper section

Each box scores the total of the dice that show its number. Other dice don't count.

| Box | Scores | Example | Points |
|---|---|---|---|
| Ones | Total of the 1s | 1 1 2 3 1 | 3 |
| Twos | Total of the 2s | 2 2 2 5 6 | 6 |
| Threes | Total of the 3s | 3 3 2 3 1 | 9 |
| Fours | Total of the 4s | 4 4 1 1 1 | 8 |
| Fives | Total of the 5s | 5 1 1 1 1 | 5 |
| Sixes | Total of the 6s | 1 2 3 4 5 | 0 |

**Upper bonus:** if the six upper boxes add up to **63 or more**, you get **35** extra points. 63 is exactly three
of each number: 3 + 6 + 9 + 12 + 15 + 18. You don't need exactly that: four 6s (24 instead of 18) make up for
only two 4s (8 instead of 12).

### Lower section

| Box | Needs | Points | Example | Points |
|---|---|---|---|---|
| Three of a Kind | At least three dice the same | Total of **all five** dice | 4 4 4 2 1 | 15 |
| Four of a Kind | At least four dice the same | Total of all five dice | 5 5 5 5 2 | 22 |
| Full House | Three of one number and two of another | 25 | 2 2 3 3 3 | 25 |
| Small Straight | Four numbers in a row | 30 | 6 5 3 4 3 (3-4-5-6) | 30 |
| Large Straight | Five numbers in a row | 40 | 2 3 4 5 6 | 40 |
| Five of a Kind | All five dice the same | 50 | 3 3 3 3 3 | 50 |
| Chance | Anything | Total of all five dice | 1 2 3 4 6 | 16 |

More examples, all from the game's tests:

| Dice | Box | Points | Why |
|---|---|---|---|
| 4 4 4 4 1 | Three of a Kind | 17 | Four of a kind also contains three of a kind |
| 4 4 3 3 1 | Three of a Kind | 0 | Only pairs |
| 5 5 5 2 2 | Four of a Kind | 0 | Only three 5s (but it's a Full House) |
| 6 6 6 6 6 | Full House | **0** | Five of a kind is not "two of another" (see below) |
| 2 2 3 3 4 | Full House | 0 | Two pairs |
| 1 2 3 4 5 | Small Straight | 30 | A large straight contains a small one |
| 1 2 3 5 6 | Small Straight | 0 | No four in a row |
| 1 2 3 4 6 | Large Straight | 0 | Only four in a row |
| 1 1 1 1 1 | Large Straight | 0 | You may score 0 in any open box |

The order of the dice never matters. Five of a Kind also counts as Three of a Kind, Four of a Kind and Chance
(total of the dice).

### Five of a Kind bonus (optional)

The source page lists this as an optional standard rule: if you roll another Five of a Kind after already scoring
50 in the Five of a Kind box, "many players award a **100-point bonus** each time".

In the app it's a setting on the new-game form: **+100 bonus for each extra Five of a Kind**. It's on by default.
How it works:

- The bonus needs **50** in the Five of a Kind box. If you scored 0 there, extra Five of a Kinds earn nothing.
- You still score the roll in some other open box, with that box's normal points. The bonus comes on top, however
  many points that box gives. With 6 6 6 6 6 in Full House you get 0 + 100.
- Each extra Five of a Kind earns another 100.
- The scorecard shows a "Five of a Kind bonus" row once any player has earned one.

### Totals and the winner

Your total is the upper section, plus the upper bonus, plus the lower section, plus any Five of a Kind bonuses.
The game ends when every player has filled all 13 boxes. The highest total wins.

Worked example (one player, the app's end-to-end test): the dice always show five 6s, and the player fills the
boxes from top to bottom.

| Boxes | Points |
|---|---|
| Ones to Fives | 0 each |
| Sixes | 30 |
| Upper bonus (30 is under 63) | 0 |
| Three of a Kind, Four of a Kind | 30 + 30 |
| Full House, Small Straight, Large Straight | 0 each |
| Five of a Kind | 50 |
| Chance | 30 |
| Five of a Kind bonus (Chance came after 50 in Five of a Kind) | 100 |
| **Total** | **270** |

The game then says `Final score: 270`. With two players who play the same way, it says
`It's a tie: Player 1 and Player 2 with 270!`.

## The course's rule decisions

The source page leaves some details open, and a computer game must decide them all. These are the course's choices.

| Topic | Source page | This course |
|---|---|---|
| Five of a Kind as a Full House | "three of one number and two of another" | Not a Full House: scores 0 there. Five dice of one number have no "two of another". The rules dialog says so |
| Extra Five of a Kind bonus | Optional rule | A setting, on by default. Earned in any box, only if Five of a Kind holds 50 |
| "Joker" rules | Not mentioned | None. The official Yahtzee rules from Hasbro add Joker rules (an extra Five of a Kind can fill Full House or a straight for full points). Here it scores each box's normal points |
| Number of players | "2 or more" | 1 to 4. Solo play is allowed |
| Who starts, turn order | Choose who goes first; turns go clockwise | Player 1 starts; turns follow the order of the names in the form, then wrap around |
| Player names | — | 1–20 characters after trimming spaces, each different (ignoring case) |
| Scoring before rolling | "Roll all five dice" comes first, but "score at any time" | Not allowed: score after 1, 2 or 3 rolls |
| Ties | Not mentioned | All tied players win together. In the standings, equal totals share a rank (1, 1, 3) |
| Holding dice | Keep any dice | Hold or release any die between rolls; holds reset at the start of each turn |

## From rules to code

The rules live in plain TypeScript in `project/ch20/src/game/`, with no React. The components only display them.

| Rule | Code | Test |
|---|---|---|
| Three rolls per turn | `MAX_ROLLS = 3` in `rules.ts`; `rollsLeft` in `reducer.ts` | `reducer.test.ts`: "rolls, counts down and must score after three rolls" |
| Rolling; held dice keep their value | `rollDie(rng)`, `applyRoll` and `toggleHold` in `dice.ts` | `dice.test.ts`; `reducer.test.ts`: "keeps held dice when rolling" |
| 13 boxes | `CATEGORIES` (`UPPER_CATEGORIES` + `LOWER_CATEGORIES`) and `CATEGORY_LABELS` in `rules.ts` | `scoring.test.ts`: "is true only when all 13 categories are filled" |
| Points per box | `scoreCategory(category, values)` in `scoring.ts` | `scoring.test.ts`: the `it.each` table (20 rows) |
| Fixed points and thresholds | Named constants in `rules.ts`, such as `UPPER_BONUS_THRESHOLD = 63` and `FULL_HOUSE_POINTS = 25` | — |
| Five of a Kind is not a Full House | `counts.includes(3) && counts.includes(2)` in `scoreCategory` | `['fullHouse', [6, 6, 6, 6, 6], 0]` |
| Straights | `longestRun(counts)`: at least 4 for small, exactly 5 for large | `['smallStraight', [1, 2, 3, 4, 5], 30]` and others |
| Each box once; 0 allowed | `scoreTurn` throws if the box is filled; the reducer ignores a `score` action for it | "refuses to score the same category twice", "allows scoring 0…" |
| Optional bonus | `scoreTurn(…, bonusRule)` counts `fiveOfAKindBonuses`; the setting comes from the new-game form | "is earned by another Five of a Kind after scoring 50" and its neighbours |
| Totals and upper bonus | `totals(sheet)`: `upper`, `upperBonus`, `lower`, `fiveOfAKindBonus`, `grand` | "adds the 35 point bonus at exactly 63…", "gives no upper bonus at 62" |
| Potential scores | `potentialScores(sheet, values)`: open boxes only | "lists only the categories that are still open" |
| Must roll first; must score after the third roll | `getPhase(state)`: `ready`, `rolling`, `mustScore`, `gameOver`. Actions that don't fit the phase return the same state | "ignores holding and scoring before the first roll" |
| Next player's turn | `current: (state.current + 1) % state.players.length`, fresh dice, `rollsLeft: 3` | "passes the turn to the next player and back" |
| End of the game | `gameOver` when `isSheetComplete` is true for every player | "ends only when every player has filled the card" |
| Winner and ties | `rankPlayers(players)`: rank = 1 + number of players with a higher total; the game-over message in `components/GameOver.tsx` | "sorts by total and lets ties share a rank"; `App.test.tsx`: "announces a tie when players finish level" |
| 1–4 players, valid names | `MIN_PLAYERS = 1`, `MAX_PLAYERS = 4`, `MAX_NAME_LENGTH = 20`, `validatePlayerNames(names)` in `rules.ts` | `rules.test.ts` (7 cases) |

The heart of the Full House decision, from `scoring.ts`:

```ts
case 'fullHouse':
  // "Three of one number and two of another": five of a kind does not count.
  return counts.includes(3) && counts.includes(2) ? FULL_HOUSE_POINTS : 0
```

`counts[face]` is how many dice show that face. Five 6s give counts with a 5 and no 3 or 2, so the box scores 0.

And the bonus rule:

```ts
const earnsBonus =
  bonusRule && isFiveOfAKind(values) && sheet.scores.fiveOfAKind === FIVE_OF_A_KIND_POINTS
```

The check doesn't look at `category`: the bonus is the same whichever box you fill.

The dice code is introduced in [Chapter 3](03-javascript-for-react.md), `rules.ts` in
[Chapter 4](04-components-and-jsx.md) (the boxes) and [Chapter 5](05-state-and-events.md) (the roll limit),
`scoring.ts` with the bonus rule in [Chapter 6](06-thinking-in-react.md), the reducer in
[Chapter 7](07-reducers.md), the new-game form, its bonus setting and turns passing between players in
[Chapter 9](09-forms.md), a scorecard column per player and ties in [Chapter 10](10-composition-and-context.md),
and the rules dialog that shows these rules in the app in [Chapter 18](18-portals-and-dialogs.md).

Sources for this chapter: [REFERENCES.md](REFERENCES.md#appendix-c--five-dice-rules)
