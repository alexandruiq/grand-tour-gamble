import { supabase } from '@/lib/supabase'
import { STAGE_MULTIPLIERS, ALIGNMENT_MULTIPLIERS, SYNERGY_CHANGES } from '@/lib/constants'

// AI Team Profiles (from Edge Function)
const AI_PROFILES = {
  solaris: { cruiseRate: 0.6 }, // 60% cruise, 40% sprint
  corex:   { cruiseRate: 0.5 }, // 50% cruise, 50% sprint
  vortex:  { cruiseRate: 0.15 }, // 15% cruise, 85% sprint (aggressive)
}

/**
 * Calculate and award points for a completed stage
 * Implements the proper decision matrix scoring
 */
export async function calculateAndAwardStageResults(sessionId: string, stageNumber: number) {
  try {
    console.log(`🧮 Calculating results for session ${sessionId}, stage ${stageNumber}`)
    
    // Get all decisions for this stage
    const { data: decisions, error: decisionsError } = await supabase
      .from('decisions_log')
      .select(`
        cyclist_id,
        decision,
        cyclists (
          id,
          stamina,
          current_points
        )
      `)
      .eq('session_id', sessionId)
      .eq('stage_number', stageNumber)

    if (decisionsError) {
      console.error('❌ Error fetching decisions:', decisionsError)
      throw decisionsError
    }

    if (!decisions || decisions.length === 0) {
      console.log('ℹ️ No decisions found for this stage')
      return { success: true, message: 'No decisions to process' }
    }

    console.log(`📊 Processing ${decisions.length} decisions`)

    // Count sprint vs cruise decisions
    const sprintCount = decisions.filter(d => d.decision === 'sprint').length
    const cruiseCount = decisions.filter(d => d.decision === 'cruise').length
    
    console.log(`🏃 Sprint: ${sprintCount}, 🚴 Cruise: ${cruiseCount}`)

    // Get current team synergy
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .select('id, synergy_score, total_points')
      .eq('session_id', sessionId)
      .eq('type', 'rubicon')
      .single()

    if (teamError) {
      console.error('❌ Error fetching team data:', teamError)
      throw teamError
    }

    const currentSynergy = teamData.synergy_score || 50

    // Check if this is a negotiation stage and calculate multipliers
    const isNegotiationStage = [4, 7, 10].includes(stageNumber)
    let stageMultiplier = 1.0
    let alignmentMultiplier = 1.0
    
    if (isNegotiationStage) {
      // Stage-specific base multipliers
      stageMultiplier = STAGE_MULTIPLIERS[stageNumber as keyof typeof STAGE_MULTIPLIERS] || STAGE_MULTIPLIERS.default
      
      // Calculate alignment bonus multiplier
      if (sprintCount === 4 || cruiseCount === 4) {
        alignmentMultiplier = ALIGNMENT_MULTIPLIERS.perfect // Perfect alignment (all 4 same choice)
      } else if (sprintCount >= 3 || cruiseCount >= 3) {
        alignmentMultiplier = ALIGNMENT_MULTIPLIERS.good // Good alignment (3 of 4 same choice)
      } else {
        alignmentMultiplier = ALIGNMENT_MULTIPLIERS.poor // Poor alignment (2/2 split)
      }
      
      console.log(`🎯 Negotiation Stage ${stageNumber}: ${stageMultiplier}x (stage) × ${alignmentMultiplier}x (${sprintCount === 4 || cruiseCount === 4 ? 'perfect' : sprintCount >= 3 || cruiseCount >= 3 ? 'good' : 'poor'} alignment) = ${stageMultiplier * alignmentMultiplier}x total`)
    }
    
    const totalMultiplier = stageMultiplier * alignmentMultiplier

    // Calculate points based on decision matrix (from Edge Function logic)
    const cyclistPoints: Record<string, number> = {}

    if (cruiseCount === 4) {
      // All cruise: +1 each
      decisions.forEach(d => {
        if (d.decision === 'cruise') cyclistPoints[d.cyclist_id] = 1
      })
    } else if (cruiseCount === 3 && sprintCount === 1) {
      // 3 cruise, 1 sprint: sprint gets +3, cruise gets -1
      decisions.forEach(d => {
        if (d.decision === 'sprint') cyclistPoints[d.cyclist_id] = 3
        if (d.decision === 'cruise') cyclistPoints[d.cyclist_id] = -1
      })
    } else if (cruiseCount === 2 && sprintCount === 2) {
      // 2 cruise, 2 sprint: sprint gets +2, cruise gets -2
      decisions.forEach(d => {
        if (d.decision === 'sprint') cyclistPoints[d.cyclist_id] = 2
        if (d.decision === 'cruise') cyclistPoints[d.cyclist_id] = -2
      })
    } else if (cruiseCount === 1 && sprintCount === 3) {
      // 1 cruise, 3 sprint: sprint gets +1, cruise gets -3
      decisions.forEach(d => {
        if (d.decision === 'sprint') cyclistPoints[d.cyclist_id] = 1
        if (d.decision === 'cruise') cyclistPoints[d.cyclist_id] = -3
      })
    } else if (sprintCount === 4) {
      // All sprint: -1 each
      decisions.forEach(d => {
        if (d.decision === 'sprint') cyclistPoints[d.cyclist_id] = -1
      })
    }

    // Calculate synergy change based on decision combination
    let synergyChange = 0
    if (cruiseCount === 4) {
      synergyChange = SYNERGY_CHANGES.fourCruise
    } else if (cruiseCount === 3 && sprintCount === 1) {
      synergyChange = SYNERGY_CHANGES.threeCruise
    } else if (cruiseCount === 2 && sprintCount === 2) {
      synergyChange = SYNERGY_CHANGES.balanced
    } else if (cruiseCount === 1 && sprintCount === 3) {
      synergyChange = SYNERGY_CHANGES.threeSprint
    } else if (sprintCount === 4) {
      synergyChange = SYNERGY_CHANGES.fourSprint
    }

    const newSynergy = Math.max(0, Math.min(100, currentSynergy + synergyChange))
    console.log(`🤝 Synergy: ${currentSynergy} → ${newSynergy} (${synergyChange >= 0 ? '+' : ''}${synergyChange})`)

    // Update cyclists with points and stamina
    const cyclistUpdates = []
    
    for (const decision of decisions) {
      const cyclist = decision.cyclists
      if (!cyclist) continue

      const basePoints = cyclistPoints[decision.cyclist_id] || 0
      // Apply total multiplier (stage × alignment)
      const pointsEarned = Math.floor(basePoints * totalMultiplier)
      
      console.log(`🧮 Cyclist ${decision.cyclist_id}: ${basePoints} base points × ${totalMultiplier} = ${pointsEarned} final points`)
      
      // Calculate new stamina
      let newStamina = cyclist.stamina
      if (decision.decision === 'sprint') {
        newStamina = Math.max(0, cyclist.stamina - 1)
      } else if (decision.decision === 'cruise' && currentSynergy >= 50) {
        // Cruise gives +1 stamina only if team synergy is good (≥50)
        newStamina = Math.min(5, cyclist.stamina + 1)
      } else if (decision.decision === 'cruise') {
        // Cruise with poor synergy doesn't recover stamina
        newStamina = cyclist.stamina
      }

      // Calculate new total points
      const newTotalPoints = cyclist.current_points + pointsEarned

      console.log(`🔄 Updating cyclist ${decision.cyclist_id}: ${pointsEarned} points (${basePoints} × ${totalMultiplier}), stamina ${cyclist.stamina} → ${newStamina}`)

      // Update cyclist
      const { error: updateError } = await supabase
        .from('cyclists')
        .update({
          current_points: newTotalPoints,
          stamina: newStamina
        })
        .eq('id', decision.cyclist_id)

      if (updateError) {
        console.error(`❌ Error updating cyclist ${decision.cyclist_id}:`, updateError)
      }

      // Update decision log with points earned
      const { error: logError } = await supabase
        .from('decisions_log')
        .update({ points_earned: pointsEarned })
        .eq('cyclist_id', decision.cyclist_id)
        .eq('session_id', sessionId)
        .eq('stage_number', stageNumber)

      if (logError) {
        console.error(`❌ Error updating decision log:`, logError)
      }

      cyclistUpdates.push({
        cyclist_id: decision.cyclist_id,
        points: pointsEarned,
        newTotal: newTotalPoints,
        stamina: newStamina
      })
    }

    // Update team synergy and total points
    const totalTeamPoints = cyclistUpdates.reduce((sum, update) => sum + update.points, 0)
    const newTeamPoints = (teamData.total_points || 0) + totalTeamPoints

    const { error: teamUpdateError } = await supabase
      .from('teams')
      .update({
        synergy_score: newSynergy,
        total_points: newTeamPoints
      })
      .eq('id', teamData.id)

    if (teamUpdateError) {
      console.error('❌ Error updating team synergy:', teamUpdateError)
    } else {
      console.log(`✅ Updated team: synergy ${currentSynergy} → ${newSynergy}, total points ${newTeamPoints}`)
    }

    // --- AI TEAM SIMULATION (from Edge Function) ---
    console.log('🤖 Simulating AI team decisions...')
    
    const { data: aiTeams, error: aiTeamsError } = await supabase
      .from('teams')
      .select('id, type, name, total_points, synergy_score')
      .eq('session_id', sessionId)
      .in('type', ['solaris', 'corex', 'vortex'])

    if (aiTeamsError) {
      console.error('❌ Error fetching AI teams:', aiTeamsError)
    } else {
      console.log(`🤖 Found ${aiTeams?.length || 0} AI teams to simulate`)
      
      for (const aiTeam of aiTeams || []) {
        const profile = AI_PROFILES[aiTeam.type as keyof typeof AI_PROFILES]
        
        // Simulate 4 cyclist decisions for this AI team
        let sprintCountAI = 0
        for (let i = 0; i < 4; i++) {
          if (Math.random() < (1 - profile.cruiseRate)) sprintCountAI++
        }
        const cruiseCountAI = 4 - sprintCountAI
        
        console.log(`🤖 ${aiTeam.name} (${aiTeam.type}): ${sprintCountAI} sprint, ${cruiseCountAI} cruise`)
        
        // Calculate AI team stage points using same point rules as humans
        let teamStagePoints = 0
        if (cruiseCountAI === 4) {
          teamStagePoints = 4 * 1 // All cruise: +1 each
        } else if (cruiseCountAI === 3 && sprintCountAI === 1) {
          teamStagePoints = (3 * -1) + (1 * 3) // 3 cruise get -1, 1 sprint gets +3
        } else if (cruiseCountAI === 2 && sprintCountAI === 2) {
          teamStagePoints = (2 * -2) + (2 * 2) // 2 cruise get -2, 2 sprint get +2
        } else if (cruiseCountAI === 1 && sprintCountAI === 3) {
          teamStagePoints = (1 * -3) + (3 * 1) // 1 cruise gets -3, 3 sprint get +1
        } else if (sprintCountAI === 4) {
          teamStagePoints = 4 * -1 // All sprint: -1 each
        }
        
        // Apply negotiation multiplier (same as humans)
        teamStagePoints = Math.floor(teamStagePoints * totalMultiplier)
        
        // Calculate AI synergy change (same rules as humans)
        let synergyChangeAI = 0
        if (cruiseCountAI === 4) synergyChangeAI = SYNERGY_CHANGES.fourCruise
        else if (cruiseCountAI === 3 && sprintCountAI === 1) synergyChangeAI = SYNERGY_CHANGES.threeCruise
        else if (cruiseCountAI === 2 && sprintCountAI === 2) synergyChangeAI = SYNERGY_CHANGES.balanced
        else if (cruiseCountAI === 1 && sprintCountAI === 3) synergyChangeAI = SYNERGY_CHANGES.threeSprint
        else if (sprintCountAI === 4) synergyChangeAI = SYNERGY_CHANGES.fourSprint
        
        const newAISynergy = Math.max(0, Math.min(100, aiTeam.synergy_score + synergyChangeAI))
        
        console.log(`🤖 ${aiTeam.name}: ${teamStagePoints} points (${teamStagePoints / totalMultiplier} base × ${totalMultiplier}), synergy ${aiTeam.synergy_score} → ${newAISynergy}`)
        
        // Update AI team in database
        const prevPoints = aiTeam.total_points ?? 0
        const { error: aiUpdateError } = await supabase
          .from('teams')
          .update({
            total_points: prevPoints + teamStagePoints,
            synergy_score: newAISynergy
          })
          .eq('id', aiTeam.id)
          
        if (aiUpdateError) {
          console.error(`❌ Error updating AI team ${aiTeam.name}:`, aiUpdateError)
        } else {
          console.log(`✅ Updated AI team ${aiTeam.name}: +${teamStagePoints} points, synergy ${newAISynergy}`)
        }
      }
    }

    // If this is Stage 10, mark session as ended (game complete)
    if (stageNumber === 10) {
      const { error: endGameError } = await supabase
        .from('sessions')
        .update({ status: 'ended' })
        .eq('id', sessionId)

      if (endGameError) {
        console.error('❌ Error marking game as ended:', endGameError)
      } else {
        console.log('🏁 Game completed! Session marked as ended')
      }
    }

    console.log(`✅ Stage ${stageNumber} results calculated:`, cyclistUpdates)
    
    return {
      success: true,
      stage: stageNumber,
      results: cyclistUpdates,
      stageMultiplier: stageMultiplier,
      alignmentMultiplier: alignmentMultiplier,
      totalMultiplier: totalMultiplier,
      synergyChange: synergyChange,
      newSynergy: newSynergy,
      teamPoints: totalTeamPoints,
      gameEnded: stageNumber === 10,
      message: `Stage ${stageNumber} completed - Human: ${sprintCount} sprinted, ${cruiseCount} cruised${isNegotiationStage ? ` (${stageMultiplier}x stage × ${alignmentMultiplier}x alignment = ${totalMultiplier}x total)` : ''}, synergy ${currentSynergy} → ${newSynergy}. AI teams simulated.${stageNumber === 10 ? ' 🏁 GAME COMPLETE!' : ''}`
    }

  } catch (error) {
    console.error('❌ Error in stage calculation:', error)
    // Don't throw the error - allow the game to continue
    return {
      success: false,
      stage: stageNumber,
      stageMultiplier: 1.0,
      alignmentMultiplier: 1.0,
      totalMultiplier: 1.0,
      synergyChange: 0,
      newSynergy: 50,
      teamPoints: 0,
      gameEnded: false,
      message: `Stage ${stageNumber} completed with calculation errors`
    }
  }
}