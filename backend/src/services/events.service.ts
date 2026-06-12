import { Event } from '../models/Event.js';
import { ApiError } from '../utils/api-error.js';
import { resolveSchoolId } from '../utils/school.js';

export class EventsService {
  async getEvents(context: any) {
    const schoolId = await resolveSchoolId(context);
    return Event.find({ schoolId }).sort({ date: 1 });
  }

  async createEvent(context: any, input: any) {
    const schoolId = await resolveSchoolId(context);
    const event = new Event({ ...input, schoolId });
    await event.save();
    return event;
  }

  async updateEvent(context: any, id: string, input: any) {
    const schoolId = await resolveSchoolId(context);
    const event = await Event.findOneAndUpdate(
      { _id: id, schoolId },
      { $set: input },
      { new: true, runValidators: true },
    );
    if (!event) throw new ApiError(404, "Event not found");
    return event;
  }

  async deleteEvent(context: any, id: string) {
    const schoolId = await resolveSchoolId(context);
    const deleted = await Event.deleteOne({ _id: id, schoolId });
    if (deleted.deletedCount === 0) throw new ApiError(404, "Event not found");
  }

  async rsvpEvent(context: any, id: string) {
    const schoolId = await resolveSchoolId(context);
    const event = await Event.findOneAndUpdate(
      { _id: id, schoolId },
      { $inc: { rsvpCount: 1 } },
      { new: true }
    );
    if (!event) throw new ApiError(404, "Event not found");
    return event;
  }

  async volunteerEvent(context: any, id: string, volunteerName: string) {
    const schoolId = await resolveSchoolId(context);
    const event = await Event.findOneAndUpdate(
      { _id: id, schoolId },
      { $push: { volunteers: volunteerName } },
      { new: true }
    );
    if (!event) throw new ApiError(404, "Event not found");
    return event;
  }

  async uploadGallery(context: any, id: string, photoUrl: string) {
    const schoolId = await resolveSchoolId(context);
    const event = await Event.findOneAndUpdate(
      { _id: id, schoolId },
      { $push: { gallery: photoUrl } },
      { new: true }
    );
    if (!event) throw new ApiError(404, "Event not found");
    return event;
  }
}
