import { SportsTeam, Tournament, ExtracurricularActivity, Achievement, SportsEvent } from '../models/index.js';

export class SportsService {
  static async getTeams(schoolId: string) {
    return SportsTeam.find({ schoolId }).sort({ createdAt: -1 });
  }

  static async createTeam(schoolId: string, data: any) {
    return SportsTeam.create({ ...data, schoolId });
  }

  static async getTournaments(schoolId: string) {
    return Tournament.find({ schoolId }).sort({ createdAt: -1 });
  }

  static async createTournament(schoolId: string, data: any) {
    return Tournament.create({ ...data, schoolId });
  }

  static async getActivities(schoolId: string) {
    return ExtracurricularActivity.find({ schoolId }).sort({ createdAt: -1 });
  }

  static async createActivity(schoolId: string, data: any) {
    return ExtracurricularActivity.create({ ...data, schoolId });
  }

  static async getAchievements(schoolId: string) {
    return Achievement.find({ schoolId }).sort({ date: -1 });
  }

  static async createAchievement(schoolId: string, data: any) {
    return Achievement.create({ ...data, schoolId });
  }

  static async getEvents(schoolId: string) {
    return SportsEvent.find({ schoolId }).sort({ startDate: 1 });
  }

  static async createEvent(schoolId: string, data: any) {
    return SportsEvent.create({ ...data, schoolId });
  }
}
