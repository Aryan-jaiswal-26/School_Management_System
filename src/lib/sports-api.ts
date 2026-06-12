import { apiClient } from './api-client';

export async function fetchSportsTeams() {
  const { data } = await apiClient('/sports/teams');
  return data;
}

export async function fetchTournaments() {
  const { data } = await apiClient('/sports/tournaments');
  return data;
}

export async function fetchActivities() {
  const { data } = await apiClient('/sports/activities');
  return data;
}

export async function createTeam(teamData: any) {
  const { data } = await apiClient('/sports/teams', {
    method: 'POST',
    body: JSON.stringify(teamData),
  });
  return data;
}

export async function createTournament(tournamentData: any) {
  const { data } = await apiClient('/sports/tournaments', {
    method: 'POST',
    body: JSON.stringify(tournamentData),
  });
  return data;
}

export async function fetchAchievements() {
  const { data } = await apiClient('/sports/achievements');
  return data;
}

export async function createAchievement(achievementData: any) {
  const { data } = await apiClient('/sports/achievements', {
    method: 'POST',
    body: JSON.stringify(achievementData),
  });
  return data;
}

export async function fetchEvents() {
  const { data } = await apiClient('/sports/events');
  return data;
}

export async function createEvent(eventData: any) {
  const { data } = await apiClient('/sports/events', {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
  return data;
}
