import { Router } from "express";
import { z } from "zod";

import { createNotFoundError } from "../errors.js";
import { sanitizeLikePatternTerm } from "../filters.js";
import { handleRoute } from "../route-handler.js";
import { listFacilitiesQuerySchema, createFacilitySchema } from "../schemas/facilities.js";
import { idParamSchema } from "../schemas/common.js";
import { throwSupabaseError } from "../supabase-errors.js";
import { sendSuccess } from "../response.js";
import { validate } from "../middleware/validate.js";
import type { TableInsert } from "../../types/database.js";

type FacilitiesQuery = z.infer<typeof listFacilitiesQuerySchema>;
type CreateFacilityInput = z.infer<typeof createFacilitySchema>;

export const facilitiesRouter = Router();

facilitiesRouter.get(
  "/",
  validate({ query: listFacilitiesQuerySchema }),
  handleRoute(async (req, res) => {
    const { city, facilityType, isActive, limit } =
      req.context.validated?.query as FacilitiesQuery;

    let query = req.context.supabase
      .from("facilities")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (facilityType) {
      query = query.eq("facility_type", facilityType);
    }

    if (city) {
      const sanitizedCity = sanitizeLikePatternTerm(city);

      if (sanitizedCity) {
        query = query.ilike("city", `%${sanitizedCity}%`);
      }
    }

    if (isActive !== undefined) {
      query = query.eq("is_active", isActive);
    }

    const { data, error } = await query;

    if (error) {
      throwSupabaseError("Unable to list facilities.", error);
    }

    sendSuccess(req, res, data ?? []);
  }),
);

facilitiesRouter.get(
  "/:id",
  validate({ params: idParamSchema }),
  handleRoute(async (req, res) => {
    const { id } = req.context.validated?.params as z.infer<typeof idParamSchema>;

    const { data, error } = await req.context.supabase
      .from("facilities")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throwSupabaseError("Unable to load the facility.", error);
    }

    if (!data) {
      throw createNotFoundError("Facility");
    }

    sendSuccess(req, res, data);
  }),
);

facilitiesRouter.post(
  "/",
  validate({ body: createFacilitySchema }),
  handleRoute(async (req, res) => {
    const body = req.context.validated?.body as CreateFacilityInput;

    const payload: TableInsert<"facilities"> = {
      organization_id: req.context.organizationId!,
      name: body.name,
      facility_type: body.facilityType ?? null,
      address: body.address ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      postal_code: body.postalCode ?? null,
      country: body.country ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      timezone: body.timezone,
      is_active: body.isActive,
      metadata: body.metadata ?? {},
    };

    const { data, error } = await req.context.supabase
      .from("facilities")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throwSupabaseError("Unable to create the facility.", error);
    }

    sendSuccess(req, res, data, 201);
  }),
);
