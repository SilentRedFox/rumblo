export function levenshtein(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)])
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
    }
  }
  return dp[m][n]
}

export function matchAnswer(input, acceptedAnswers, alreadyCorrect = []) {
  const cleaned = input.toLowerCase().trim()
  if (!cleaned) return { result: 'empty' }
  if (alreadyCorrect.map(a => a.toLowerCase()).includes(cleaned)) return { result: 'duplicate' }

  let bestMatch = null
  let bestDist = Infinity
  for (const answer of acceptedAnswers) {
    const dist = levenshtein(cleaned, answer.toLowerCase())
    if (dist < bestDist) { bestDist = dist; bestMatch = answer }
  }

  const tolerance1 = bestMatch && bestMatch.length > 6 ? 2 : 1
  const tolerance2 = bestMatch && bestMatch.length > 6 ? 4 : 3

  if (bestDist === 0 || bestDist <= tolerance1) return { result: 'correct', canonical: bestMatch }
  else if (bestDist <= tolerance2) return { result: 'close' }
  else return { result: 'wrong' }
}