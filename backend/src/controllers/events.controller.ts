import { Request, Response } from 'express';
import { EventsService } from '../services/events.service.js';
import { sendResponse } from '../utils/response.js';

const eventsService = new EventsService();

export async function getEvents(req: Request, res: Response) {
  const events = await eventsService.getEvents(req.user || req);
  return sendResponse(res, 200, 'Events retrieved', events);
}

export async function createEvent(req: Request, res: Response) {
  const event = await eventsService.createEvent(req.user || req, req.body);
  return sendResponse(res, 201, 'Event created successfully', event);
}

export async function updateEvent(req: Request, res: Response) {
  const event = await eventsService.updateEvent(req.user || req, String(req.params.id), req.body);
  return sendResponse(res, 200, 'Event updated successfully', event);
}

export async function deleteEvent(req: Request, res: Response) {
  await eventsService.deleteEvent(req.user || req, String(req.params.id));
  return sendResponse(res, 204, 'Event deleted successfully');
}

export async function rsvpEvent(req: Request, res: Response) {
  const event = await eventsService.rsvpEvent(req.user || req, String(req.params.id));
  return sendResponse(res, 200, 'RSVP successful', event);
}

export async function volunteerEvent(req: Request, res: Response) {
  const event = await eventsService.volunteerEvent(req.user || req, String(req.params.id), req.body.volunteerName);
  return sendResponse(res, 200, 'Volunteer signup successful', event);
}

export async function uploadGallery(req: Request, res: Response) {
  const event = await eventsService.uploadGallery(req.user || req, String(req.params.id), req.body.photoUrl);
  return sendResponse(res, 200, 'Gallery photo uploaded', event);
}
