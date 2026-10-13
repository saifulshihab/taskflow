import "dotenv/config";
import { recordActivity } from "./lib/activity.js";
import { hashPassword } from "./lib/password.js";
import { prisma } from "./lib/prisma.js";
import {
  Priority,
  ProjectStatus,
  Role,
  TaskStatus,
} from "./generated/prisma/enums.js";

const SEED_PASSWORD = "password123";

/**
 * Development seed: clears every table, then rebuilds a workspace that
 * exercises each relation. Never point this at a database you care about.
 */
const reset = async () => {
  await prisma.activityEvent.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.taskLabel.deleteMany();
  await prisma.task.deleteMany();
  await prisma.label.deleteMany();
  await prisma.project.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
};

const main = async () => {
  await reset();

  const passwordHash = await hashPassword(SEED_PASSWORD);
  const [ada, grace, linus] = await Promise.all([
    prisma.user.create({
      data: { email: "ada@taskflow.dev", name: "Ada Lovelace", passwordHash },
    }),
    prisma.user.create({
      data: { email: "grace@taskflow.dev", name: "Grace Hopper", passwordHash },
    }),
    prisma.user.create({
      data: {
        email: "linus@taskflow.dev",
        name: "Linus Torvalds",
        passwordHash,
      },
    }),
  ]);

  const workspace = await prisma.workspace.create({
    data: {
      name: "Acme Rockets",
      slug: "acme-rockets",
      memberships: {
        create: [
          { userId: ada.id, role: Role.OWNER },
          { userId: grace.id, role: Role.ADMIN },
          { userId: linus.id, role: Role.MEMBER },
        ],
      },
    },
  });

  const [backend, research, urgent] = await Promise.all([
    prisma.label.create({
      data: { workspaceId: workspace.id, name: "backend", color: "#2563eb" },
    }),
    prisma.label.create({
      data: { workspaceId: workspace.id, name: "research", color: "#7c3aed" },
    }),
    prisma.label.create({
      data: { workspaceId: workspace.id, name: "urgent", color: "#dc2626" },
    }),
  ]);

  const apollo = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Apollo Launch Program",
      key: "ALP",
      description: "Everything needed for the first orbital launch",
      status: ProjectStatus.ACTIVE,
    },
  });

  const ground = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Ground Control",
      key: "GC",
      description: "Telemetry, comms and launch-site tooling",
      status: ProjectStatus.ACTIVE,
    },
  });

  const inDays = (days: number) =>
    new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const engine = await prisma.task.create({
    data: {
      projectId: apollo.id,
      creatorId: ada.id,
      assigneeId: grace.id,
      title: "Design the second-stage engine",
      description: "Target 90kN thrust with a regeneratively cooled nozzle.",
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      dueDate: inDays(14),
      position: 1,
      labels: { create: [{ labelId: backend.id }, { labelId: research.id }] },
    },
  });

  await prisma.task.createMany({
    data: [
      {
        projectId: apollo.id,
        creatorId: grace.id,
        parentTaskId: engine.id,
        title: "Pick a nozzle alloy",
        status: TaskStatus.DONE,
        priority: Priority.MEDIUM,
        completedAt: new Date(),
        position: 2,
      },
      {
        projectId: apollo.id,
        creatorId: grace.id,
        parentTaskId: engine.id,
        assigneeId: linus.id,
        title: "Run combustion simulations",
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
        position: 3,
      },
      {
        projectId: apollo.id,
        creatorId: ada.id,
        title: "Write the flight termination procedure",
        status: TaskStatus.TODO,
        priority: Priority.URGENT,
        dueDate: inDays(3),
        position: 4,
      },
      {
        projectId: apollo.id,
        creatorId: linus.id,
        title: "Investigate reusable fairings",
        status: TaskStatus.BACKLOG,
        priority: Priority.LOW,
        position: 5,
      },
      {
        projectId: ground.id,
        creatorId: ada.id,
        assigneeId: ada.id,
        title: "Stand up the telemetry ingest service",
        status: TaskStatus.TODO,
        priority: Priority.HIGH,
        dueDate: inDays(7),
        position: 1,
      },
      {
        projectId: ground.id,
        creatorId: grace.id,
        title: "Replace the launch-site radio mast",
        status: TaskStatus.CANCELLED,
        priority: Priority.MEDIUM,
        position: 2,
      },
    ],
  });

  const termination = await prisma.task.findFirstOrThrow({
    where: { title: "Write the flight termination procedure" },
  });
  await prisma.taskLabel.create({
    data: { taskId: termination.id, labelId: urgent.id },
  });

  await prisma.comment.createMany({
    data: [
      {
        taskId: engine.id,
        authorId: ada.id,
        body: "Spec sheet is in the shared drive, revision C.",
      },
      {
        taskId: engine.id,
        authorId: linus.id,
        body: "Simulations need the final alloy choice before they mean anything.",
      },
      {
        taskId: termination.id,
        authorId: grace.id,
        body: "Range safety wants a draft by the end of the week.",
      },
    ],
  });

  // A few feed entries so the activity endpoint has something to show.
  for (const event of [
    {
      entityType: "workspace" as const,
      entityId: workspace.id,
      action: "workspace.created",
      actorId: ada.id,
    },
    {
      entityType: "project" as const,
      entityId: apollo.id,
      action: "project.created",
      actorId: ada.id,
    },
    {
      entityType: "project" as const,
      entityId: ground.id,
      action: "project.created",
      actorId: ada.id,
    },
    {
      entityType: "task" as const,
      entityId: engine.id,
      action: "task.created",
      actorId: ada.id,
    },
    {
      entityType: "task" as const,
      entityId: engine.id,
      action: "task.assigned",
      actorId: ada.id,
    },
  ]) {
    await recordActivity({ workspaceId: workspace.id, ...event });
  }

  console.log(`Seeded workspace "${workspace.name}" (${workspace.slug})`);
  console.log(
    `  users: ada@taskflow.dev, grace@taskflow.dev, linus@taskflow.dev`,
  );
  console.log(`  password for all of them: ${SEED_PASSWORD}`);
  console.log(`  projects: ${apollo.key}, ${ground.key}`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
