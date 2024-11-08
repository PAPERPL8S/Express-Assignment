// all your code should go below this line

import express from "express";
import { prisma } from "../prisma/prisma-instance";
import { errorHandleMiddleware } from "./error-handler";
import "express-async-errors";
import HttpStatusCode from "./status-codes";
import { validateId } from "./error-handler";

const {
  OK,
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  CREATED,
  NO_CONTENT,
} = HttpStatusCode;

//get all dog data

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(OK).json({ message: "Hello World!" });
});

app.get("/dogs", async (_req, res) => {
  try {
    const dogs = await prisma.dog.findMany();
    res.status(OK).json(dogs);
  } catch (error) {
    res
      .status(INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to retrieve dogs" });
  }
});

app.get("/dogs/:id", validateId, async (req, res) => {
  const id = Number(req.params.id);

  try {
    const dog = await prisma.dog.findUnique({
      where: { id },
    });

    if (!dog) {
      return res
        .status(NO_CONTENT)
        .json({ message: "Dog not found" });
    }

    return res.status(OK).json(dog);
  } catch (error) {
    res
      .status(INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to retrieve dog" });
  }
});

// POST /dogs - creates a new dog
app.post("/dogs", async (req, res) => {
  const errors: string[] = [];
  const allowedKeys = [
    "name",
    "description",
    "breed",
    "age",
  ];

  const { name, description, breed, age } = req.body;

  if (typeof age != "number") {
    errors.push("age should be a number");
  }

  if (typeof name !== "string") {
    errors.push("name should be a string");
  }

  if (typeof description !== "string") {
    errors.push("description should be a string");
  }

  if (typeof breed !== "string") {
    errors.push("breed should be a string");
  }

  for (const key in req.body) {
    if (!allowedKeys.includes(key)) {
      errors.push(`'${key}' is not a valid key`);
    }
  }

  if (errors.length) {
    return res.status(BAD_REQUEST).send({ errors });
  }

  try {
    const newDog = await prisma.dog.create({
      data: {
        name,
        description,
        breed,
        age,
      },
    });
    return res.status(CREATED).json(newDog);
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to create dog" });
  }
});

// PATCH /dogs/:id - updates a dog by id
app.patch("/dogs/:id", validateId, async (req, res) => {
  const { id } = req.params;
  const errors: string[] = [];
  const allowedKeys = [
    "name",
    "description",
    "breed",
    "age",
  ];

  const { name, description, breed, age } = req.body;

  if (age !== undefined && typeof age !== "number") {
    errors.push("age should be a number");
  }
  if (name !== undefined && typeof name !== "string") {
    errors.push("name should be a string");
  }
  if (
    description !== undefined &&
    typeof description !== "string"
  ) {
    errors.push("description should be a string");
  }
  if (breed !== undefined && typeof breed !== "string") {
    errors.push("breed should be a string");
  }

  for (const key in req.body) {
    if (!allowedKeys.includes(key)) {
      errors.push(`'${key}' is not a valid key`);
    }
  }

  if (errors.length) {
    return res.status(BAD_REQUEST).json({ errors });
  }

  try {
    const updatedDog = await prisma.dog.update({
      where: { id: Number(id) },
      data: { name, description, breed, age },
    });
    return res.status(CREATED).json(updatedDog);
  } catch (error) {
    return res
      .status(INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to update dog" });
  }
});

// DELETE /dogs/:id - Delete a dog via id
app.delete("/dogs/:id", validateId, async (req, res) => {
  const id = Number(req.params.id);

  if (isNaN(Number(id))) {
    return res
      .status(BAD_REQUEST)
      .json({ message: "id should be a number" });
  }

  try {
    const deletedDog = await prisma.dog.delete({
      where: { id },
    });
    res.status(OK).json(deletedDog);
  } catch (error) {
    res
      .status(NO_CONTENT)
      .json({ error: "Failed to delete dog" });
  }
});

app.use(errorHandleMiddleware);

const port = process.env.NODE_ENV === "test" ? 3001 : 3000;
app.listen(port, () =>
  console.log(
    `🚀 Server ready at: http://localhost:${port}`
  )
);

export default app;

// all your code should go above this line
