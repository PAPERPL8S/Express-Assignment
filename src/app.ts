// all your code should go below this line
import express from "express";
import { prisma } from "../prisma/prisma-instance";
import { errorHandleMiddleware } from "./error-handler";
import "express-async-errors";
import {
  body,
  validationResult,
  ValidationError,
} from "express-validator";

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({ message: "Hello World!" });
});

// GET /dogs - returns all dogs
app.get("/dogs", async (_req, res) => {
  try {
    const dogs = await prisma.dog.findMany();
    res.status(200).json(dogs);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to retrieve dogs" });
  }
});

// GET /dogs/:id - returns a single dog by id
app.get("/dogs/:id", async (req, res) => {
  const { id } = req.params;

  if (isNaN(Number(id))) {
    return res.status(400).json({
      message: "id should be a number",
    });
  }

  try {
    const dog = await prisma.dog.findUnique({
      where: { id: Number(id) },
    });

    if (!dog) {
      return res.status(204).send();
    }

    return res.status(200).json(dog);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to retrieve dog" });
  }
});

// POST /dogs - creates a new dog
app.post(
  "/dogs",
  [
    body("name")
      .isString()
      .withMessage("name should be a string"),
    body("description")
      .isString()
      .withMessage("description should be a string"),
    body("age")
      .optional()
      .isNumeric()
      .withMessage("age should be a number"),
    body("breed")
      .optional()
      .isString()
      .withMessage("breed should be a string"),
  ],
  async (req: express.Request, res: express.Response) => {
    const errors = validationResult(req);

    function isFieldError(
      error: ValidationError
    ): error is ValidationError & { param: string } {
      return "param" in error;
    }

    if (!errors.isEmpty()) {
      const formattedErrors = errors
        .array()
        .map((error) => ({
          message: error.msg,
          field: isFieldError(error)
            ? error.param
            : "unknown",
        }));

      return res.status(400).json({
        errors: formattedErrors.map((e) => e.message),
      });
    }

    const allowedKeys = [
      "name",
      "description",
      "age",
      "breed",
    ];
    const receivedKeys = Object.keys(req.body);
    const invalidKeys = receivedKeys.filter(
      (key) => !allowedKeys.includes(key)
    );

    if (invalidKeys.length > 0) {
      const invalidKeyErrors = invalidKeys.map((key) => ({
        message: `'${key}' is not a valid key`,
        field: key,
      }));
      return res.status(400).json({
        errors: invalidKeyErrors.map((e) => e.message),
      });
    }

    const { name, description, breed, age } = req.body;
    try {
      const newDog = await prisma.dog.create({
        data: {
          name,
          description,
          breed,
          age,
        },
      });
      return res.status(201).json(newDog);
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Failed to create dog" });
    }
  }
);

// PATCH /dogs/:id - updates a dog by id
app.patch(
  "/dogs/:id",
  [
    body("name")
      .optional()
      .isString()
      .withMessage("Name must be a string"),
    body("description")
      .optional()
      .isString()
      .withMessage("Description must be a string"),
    body("breed")
      .optional()
      .isString()
      .withMessage("Breed must be a string"),
    body("age")
      .optional()
      .isNumeric()
      .withMessage("Age must be a number"),
  ],
  async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const errors = validationResult(req);

    function isFieldError(
      error: ValidationError
    ): error is ValidationError & { param: string } {
      return "param" in error;
    }

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array().map((error) => ({
          message: error.msg,
          field: isFieldError(error)
            ? error.param
            : "unknown",
        })),
      });
    }

    const allowedKeys = [
      "name",
      "description",
      "age",
      "breed",
    ];
    const receivedKeys = Object.keys(req.body);
    const invalidKeys = receivedKeys.filter(
      (key) => !allowedKeys.includes(key)
    );

    if (invalidKeys.length > 0) {
      const invalidKeyErrors = invalidKeys.map((key) => ({
        message: `'${key}' is not a valid key`,
        field: key,
      }));
      return res
        .status(400)
        .json({ errors: invalidKeyErrors });
    }

    const { name, description, breed, age } = req.body;
    try {
      const updateDog = await prisma.dog.update({
        where: { id: Number(id) },
        data: { name, description, breed, age },
      });
      res.status(201).json(updateDog);
    } catch (error) {
      if ((error as { code?: string }).code === "P2025") {
        return res
          .status(404)
          .json({ error: "Dog not found" });
      }
      res
        .status(500)
        .json({ error: "Failed to update dog" });
    }
  }
);

// DELETE /dogs/:id - Delete a dog via id
app.delete("/dogs/:id", async (req, res) => {
  const { id } = req.params;

  if (isNaN(Number(id))) {
    return res
      .status(400)
      .json({ message: "id should be a number" });
  }

  try {
    const dogToDelete = await prisma.dog.findUnique({
      where: { id: Number(id) },
    });

    if (!dogToDelete) {
      return res.status(204).send();
    }

    await prisma.dog.delete({ where: { id: Number(id) } });
    res.status(200).json(dogToDelete);
  } catch (error) {
    res.status(400).json({ error: "Failed to delete dog" });
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
