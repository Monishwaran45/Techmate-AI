import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getQueueToken } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ProductivityService } from './productivity.service';
import { Reminder } from '../../entities/reminder.entity';
import { Task } from '../../entities/task.entity';
import { TimerSession } from '../../entities/timer-session.entity';
import { Note } from '../../entities/note.entity';
import { AIService } from '../ai/ai.service';

describe('Reminder Integration Tests', () => {
  let service: ProductivityService;
  let reminderRepository: Repository<Reminder>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductivityService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TimerSession),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Note),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Reminder),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getQueueToken('productivity-reminders'),
          useValue: {
            add: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: AIService,
          useValue: {
            chat: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductivityService>(ProductivityService);
    reminderRepository = module.get<Repository<Reminder>>(
      getRepositoryToken(Reminder),
    );
  });

  describe('Reminder Creation', () => {
    it('should create a reminder with valid future date', async () => {
      const userId = 'test-user-id';
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      const reminderData = {
        message: 'Test reminder',
        scheduledFor: futureDate.toISOString(),
      };

      const createdReminder: Reminder = {
        id: 'reminder-id',
        userId,
        message: reminderData.message,
        scheduledFor: futureDate,
        sent: false,
        sentAt: undefined,
        createdAt: new Date(),
        user: {} as any,
      };

      jest.spyOn(reminderRepository, 'create').mockReturnValue(createdReminder);
      jest.spyOn(reminderRepository, 'save').mockResolvedValue(createdReminder);

      const result = await service.createReminder(userId, reminderData);

      expect(result).toBeDefined();
      expect(result.message).toBe(reminderData.message);
      expect(result.sent).toBe(false);
      expect(reminderRepository.create).toHaveBeenCalledWith({
        userId,
        message: reminderData.message,
        scheduledFor: futureDate,
        sent: false,
      });
    });

    it('should reject reminder with past date', async () => {
      const userId = 'test-user-id';
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      const reminderData = {
        message: 'Test reminder',
        scheduledFor: pastDate.toISOString(),
      };

      await expect(
        service.createReminder(userId, reminderData),
      ).rejects.toThrow('Scheduled time must be in the future');
    });
  });

  describe('Reminder Retrieval', () => {
    it('should get all reminders for a user', async () => {
      const userId = 'test-user-id';
      const reminders: Reminder[] = [
        {
          id: 'reminder-1',
          userId,
          message: 'Reminder 1',
          scheduledFor: new Date(),
          sent: false,
          sentAt: undefined,
          createdAt: new Date(),
          user: {} as any,
        },
        {
          id: 'reminder-2',
          userId,
          message: 'Reminder 2',
          scheduledFor: new Date(),
          sent: false,
          sentAt: undefined,
          createdAt: new Date(),
          user: {} as any,
        },
      ];

      jest.spyOn(reminderRepository, 'find').mockResolvedValue(reminders);

      const result = await service.getReminders(userId);

      expect(result).toHaveLength(2);
      expect(reminderRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { scheduledFor: 'ASC' },
      });
    });

    it('should get a specific reminder by ID', async () => {
      const userId = 'test-user-id';
      const reminderId = 'reminder-id';
      const reminder: Reminder = {
        id: reminderId,
        userId,
        message: 'Test reminder',
        scheduledFor: new Date(),
        sent: false,
        sentAt: undefined,
        createdAt: new Date(),
        user: {} as any,
      };

      jest.spyOn(reminderRepository, 'findOne').mockResolvedValue(reminder);

      const result = await service.getReminderById(userId, reminderId);

      expect(result).toBeDefined();
      expect(result.id).toBe(reminderId);
      expect(reminderRepository.findOne).toHaveBeenCalledWith({
        where: { id: reminderId, userId },
      });
    });

    it('should throw NotFoundException when reminder not found', async () => {
      const userId = 'test-user-id';
      const reminderId = 'non-existent-id';

      jest.spyOn(reminderRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.getReminderById(userId, reminderId),
      ).rejects.toThrow('Reminder with ID non-existent-id not found');
    });
  });

  describe('Reminder Deletion', () => {
    it('should delete a reminder', async () => {
      const userId = 'test-user-id';
      const reminderId = 'reminder-id';
      const reminder: Reminder = {
        id: reminderId,
        userId,
        message: 'Test reminder',
        scheduledFor: new Date(),
        sent: false,
        sentAt: undefined,
        createdAt: new Date(),
        user: {} as any,
      };

      jest.spyOn(reminderRepository, 'findOne').mockResolvedValue(reminder);
      jest.spyOn(reminderRepository, 'remove').mockResolvedValue(reminder);

      await service.deleteReminder(userId, reminderId);

      expect(reminderRepository.remove).toHaveBeenCalledWith(reminder);
    });
  });
});
