import { supabase } from './supabase'

/**
 * Generate a unique 6-character alphanumeric code
 */
export function generateTrainerCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generate a unique cyclist join code
 */
export function generateCyclistCode(): string {
  return generateTrainerCode() // Same format for now
}

/**
 * Create a complete game session with cyclists and codes
 */
export async function createGameSession(
  sessionName: string,
  trainerEmail: string,
  cyclistsCount: number = 4
) {
  try {
    console.log('Creating session with:', { sessionName, trainerEmail, cyclistsCount })
    
    // Generate unique trainer code
    let trainerCode = generateTrainerCode()
    
    // Ensure trainer code is unique
    while (true) {
      const { data: existingSession, error: checkError } = await supabase
        .from('sessions')
        .select('id')
        .eq('trainer_code', trainerCode)
        .single()
      
      if (checkError && checkError.code === 'PGRST116') {
        // No matching session found, code is unique
        break
      }
      if (checkError) {
        console.error('Error checking trainer code uniqueness:', checkError)
        throw checkError
      }
      if (existingSession) {
        trainerCode = generateTrainerCode()
      } else {
        break
      }
    }

    console.log('Using trainer code:', trainerCode)

    // Create the session - using trainer email as trainer_id for now
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        title: sessionName,
        trainer_id: trainerEmail, // Using email as ID temporarily
        trainer_code: trainerCode,
        cyclists_count: cyclistsCount,
        status: 'not_started',
        current_stage: 1,
        stage_locked: true  // New sessions start with Stage 1 locked until trainer starts it
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Session creation error:', sessionError)
      throw sessionError
    }

    console.log('Session created:', session)

    // Create Team Rubicon
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        session_id: session.id,
        name: 'Team Rubicon',
        type: 'rubicon',
        synergy_score: 100,
        total_points: 0
      })
      .select()
      .single()

    if (teamError) {
      console.error('Team creation error:', teamError)
      throw teamError
    }

    console.log('Team created:', team)

    // Create AI rival teams
    const rivalTeams = [
      { name: 'Team Solaris', type: 'solaris' },
      { name: 'Team Corex', type: 'corex' },
      { name: 'Team Vortex', type: 'vortex' }
    ]

    for (const rivalTeam of rivalTeams) {
      const { error: rivalError } = await supabase
        .from('teams')
        .insert({
          session_id: session.id,
          name: rivalTeam.name,
          type: rivalTeam.type,
          synergy_score: 100,
          total_points: 0
        })
      
      if (rivalError) {
        console.error(`Error creating ${rivalTeam.name}:`, rivalError)
        throw rivalError
      }
    }

    console.log('Rival teams created')

    // Create cyclists and their join codes
    const cyclistNames = ['Luca Moretti', 'Jonas Dahl', 'Mateo Silva', 'Kenji Nakamura']
    const cyclistRoles = ['luca', 'jonas', 'mateo', 'kenji'] as const
    const cyclistCodes = []

    for (let i = 0; i < Math.min(cyclistsCount, cyclistNames.length); i++) {
      // Create cyclist
      const { data: cyclist, error: cyclistError } = await supabase
        .from('cyclists')
        .insert({
          team_id: team.id,
          name: cyclistNames[i],
          character_role: cyclistRoles[i],
          stamina: 5,
          current_points: 0,
          fatigue_penalty: false
        })
        .select()
        .single()

      if (cyclistError) {
        console.error(`Error creating cyclist ${cyclistNames[i]}:`, cyclistError)
        throw cyclistError
      }

      console.log(`Cyclist created: ${cyclistNames[i]}`, cyclist)

      // Generate unique cyclist code
      let cyclistCode = generateCyclistCode()
      while (true) {
        const { data: existingCode, error: checkError } = await supabase
          .from('cyclist_codes')
          .select('id')
          .eq('code', cyclistCode)
          .single()
        
        if (checkError && checkError.code === 'PGRST116') {
          // No matching code found, code is unique
          break
        }
        if (checkError) {
          console.error('Error checking cyclist code uniqueness:', checkError)
          throw checkError
        }
        if (existingCode) {
          cyclistCode = generateCyclistCode()
        } else {
          break
        }
      }

      // Create cyclist code
      const { error: codeError } = await supabase
        .from('cyclist_codes')
        .insert({
          session_id: session.id,
          cyclist_name: cyclistNames[i],
          cyclist_id: cyclist.id,
          code: cyclistCode
        })

      if (codeError) {
        console.error(`Error creating cyclist code for ${cyclistNames[i]}:`, codeError)
        throw codeError
      }

      cyclistCodes.push({
        name: cyclistNames[i],
        role: cyclistRoles[i],
        code: cyclistCode,
        cyclist_id: cyclist.id
      })

      console.log(`Cyclist code created: ${cyclistCode} for ${cyclistNames[i]}`)
    }

    return {
      session: {
        ...session,
        trainer_code: trainerCode
      },
      team,
      cyclistCodes
    }

  } catch (error) {
    console.error('Error creating game session:', error)
    console.error('Full error details:', JSON.stringify(error, null, 2))
    throw error
  }
}