/**
 * feedback controller
 */

import { factories } from '@strapi/strapi'

export default factories.createCoreController('api::feedback.feedback', ({ strapi }) => ({
  async create(ctx) {
    try {
      // Validate required fields
      const { data } = ctx.request.body;
      
      if (!data) {
        return ctx.badRequest('Missing data field');
      }

      if (!data.Type || !['Suggest', 'Issue', 'Question'].includes(data.Type)) {
        return ctx.badRequest('Invalid Type. Must be one of: Suggest, Issue, Question');
      }

      if (!data.Title || data.Title.trim().length === 0) {
        return ctx.badRequest('Title is required');
      }

      if (!data.Content || data.Content.trim().length === 0) {
        return ctx.badRequest('Content is required');
      }

      if (!data.Resident) {
        return ctx.badRequest('Resident ID is required');
      }

      // Validate resident exists and is published
      let resident = null;
      
      try {
        // Tìm resident bằng id
        resident = await strapi.entityService.findOne('api::resident.resident', parseInt(data.Resident));
      } catch (error) {
        console.error('Error finding resident:', error);
      }
      
      // Debug logging
      console.log('Resident search result:', {
        requestedId: data.Resident,
        residentFound: !!resident,
        residentId: resident?.id,
        residentDocumentId: resident?.documentId,
        publishedAt: resident?.publishedAt,
        publishedAtType: typeof resident?.publishedAt,
        hasPublishedAt: !!resident?.publishedAt
      });
      
      // Temporarily disable resident validation for debugging
      // if (!resident) {
      //   return ctx.badRequest('Resident not found');
      // }
      
      // Check if resident is published - more robust check
      // if (!resident.publishedAt || resident.publishedAt === null || resident.publishedAt === undefined) {
      //   return ctx.badRequest('Resident is not published. Please ensure the resident is published before creating feedback.');
      // }

      // Prepare data for creation
      const feedbackData = {
        Type: data.Type,
        Title: data.Title.trim(),
        Content: data.Content.trim(),
        Resident: data.Resident,
        StatusFeedback: 'Chưa xử lý' as const, // Default status
        publishedAt: new Date() // Auto publish
      };

      // Create feedback
      const feedback = await strapi.entityService.create('api::feedback.feedback', {
        data: feedbackData,
        populate: ['Resident', 'attachments'] as any
      });

      // Handle file uploads if any
      if (ctx.request.files && ctx.request.files['files.attachments']) {
        const files = Array.isArray(ctx.request.files['files.attachments']) 
          ? ctx.request.files['files.attachments'] 
          : [ctx.request.files['files.attachments']];

        const uploadedFiles = [];
        
        for (const file of files) {
          try {
            const uploadedFile = await strapi.plugins.upload.services.upload.upload({
              data: {
                refId: feedback.id,
                ref: 'api::feedback.feedback',
                field: 'attachments'
              },
              files: file
            });
            
            uploadedFiles.push(...uploadedFile);
          } catch (uploadError) {
            console.error('File upload error:', uploadError);
            // Continue with other files even if one fails
          }
        }

        // Update feedback with uploaded files
        if (uploadedFiles.length > 0) {
          await strapi.entityService.update('api::feedback.feedback', feedback.id, {
            data: {
              attachments: uploadedFiles.map(file => file.id)
            },
            populate: ['Resident', 'attachments'] as any
          });
        }
      }

      // Return success response
      return ctx.created({
        success: true,
        message: 'Feedback created successfully',
        data: feedback
      });

    } catch (error) {
      console.error('Feedback creation error:', error);
      return ctx.internalServerError('Failed to create feedback', { error: error.message });
    }
  },

  async find(ctx) {
    try {
      const { query } = ctx;
      
      // Add default population and filter for published residents
      const sanitizedQuery = {
        ...query,
        populate: ['Resident', 'attachments'] as any,
        filters: {
          ...(query.filters && typeof query.filters === 'object' ? query.filters : {}),
          Resident: {
            publishedAt: {
              $notNull: true
            }
          }
        },
        sort: {
          createdAt: 'desc' // Sắp xếp theo createdAt giảm dần (mới nhất lên đầu)
        } as any
      };

      const { results, pagination } = await strapi.entityService.findPage('api::feedback.feedback', sanitizedQuery);

      return ctx.send({
        success: true,
        data: results,
        pagination
      });

    } catch (error) {
      console.error('Feedback find error:', error);
      return ctx.internalServerError('Failed to fetch feedbacks', { error: error.message });
    }
  },

  async findOne(ctx) {
    try {
      const { id } = ctx.params;
      
      const feedback = await strapi.entityService.findOne('api::feedback.feedback', id, {
        populate: ['Resident', 'attachments'] as any
      });

      if (!feedback) {
        return ctx.notFound('Feedback not found');
      }

      // Check if resident is published
      const feedbackWithResident = feedback as any;
      if (feedbackWithResident.Resident && !feedbackWithResident.Resident.publishedAt) {
        return ctx.badRequest('Feedback resident is not published');
      }

      return ctx.send({
        success: true,
        data: feedback
      });

    } catch (error) {
      console.error('Feedback findOne error:', error);
      return ctx.internalServerError('Failed to fetch feedback', { error: error.message });
    }
  },

  async update(ctx) {
    try {
      const { id } = ctx.params;
      const { data } = ctx.request.body;

      // Check if feedback exists
      const existingFeedback = await strapi.entityService.findOne('api::feedback.feedback', id);
      if (!existingFeedback) {
        return ctx.notFound('Feedback not found');
      }

      // Validate data if provided
      if (data) {
        if (data.Type && !['Suggest', 'Issue', 'Question'].includes(data.Type)) {
          return ctx.badRequest('Invalid Type. Must be one of: Suggest, Issue, Question');
        }

        if (data.StatusFeedback && !['Chưa xử lý', 'Đang xử lý', 'Đã xử lý'].includes(data.StatusFeedback)) {
          return ctx.badRequest('Invalid StatusFeedback. Must be one of: Chưa xử lý, Đang xử lý, Đã xử lý');
        }
      }

      // Update feedback
      const updatedFeedback = await strapi.entityService.update('api::feedback.feedback', id, {
        data,
        populate: ['Resident', 'attachments'] as any
      });

      return ctx.send({
        success: true,
        message: 'Feedback updated successfully',
        data: updatedFeedback
      });

    } catch (error) {
      console.error('Feedback update error:', error);
      return ctx.internalServerError('Failed to update feedback', { error: error.message });
    }
  },

  async delete(ctx) {
    try {
      const { id } = ctx.params;

      // Check if feedback exists
      const existingFeedback = await strapi.entityService.findOne('api::feedback.feedback', id);
      if (!existingFeedback) {
        return ctx.notFound('Feedback not found');
      }

      // Delete feedback
      await strapi.entityService.delete('api::feedback.feedback', id);

      return ctx.send({
        success: true,
        message: 'Feedback deleted successfully'
      });

    } catch (error) {
      console.error('Feedback delete error:', error);
      return ctx.internalServerError('Failed to delete feedback', { error: error.message });
    }
  },

        // Get feedbacks of current user
      async myFeedbacks(ctx) {
        try {
          const { query } = ctx;
          const residentId = query.residentId as string;

          if (!residentId) {
            return ctx.badRequest('Resident ID is required');
          }

          // Add default population and filter for current resident
          const sanitizedQuery = {
            ...query,
            populate: ['Resident', 'attachments'] as any,
            filters: {
              ...(query.filters && typeof query.filters === 'object' ? query.filters : {}),
              Resident: {
                id: parseInt(residentId)
              }
            },
            sort: {
              createdAt: 'desc' // Sắp xếp theo createdAt giảm dần (mới nhất lên đầu)
            } as any
          };

      const { results, pagination } = await strapi.entityService.findPage('api::feedback.feedback', sanitizedQuery);

      return ctx.send({
        success: true,
        data: results,
        pagination
      });

    } catch (error) {
      console.error('My feedbacks error:', error);
      return ctx.internalServerError('Failed to fetch my feedbacks', { error: error.message });
    }
  }
}));
