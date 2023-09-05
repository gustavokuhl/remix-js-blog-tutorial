import type { ActionArgs } from "@remix-run/node";
import type { LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useNavigation,
  useLoaderData,
} from "@remix-run/react";
import { marked } from "marked";
import invariant from "tiny-invariant";

import { getPost, updatePost } from "~/models/post.server";

export const loader = async ({ params }: LoaderArgs) => {
  invariant(params.slug, "params.slug is required");

  const post = await getPost(params.slug);
  invariant(post, `Post not found: ${params.slug}`);

  return json({ post });
};

export const action = async ({ request, params }: ActionArgs) => {
  const formData = await request.formData();

  const slug = params.slug;
  const title = formData.get("title");
  const markdown = formData.get("markdown");

  const errors = {
    title: title ? null : "Title is required",
    slug: slug ? null : "Slug is required",
    markdown: markdown ? null : "Markdown is required",
  };

  const hasErrors = Object.values(errors).some((errorMessage) => errorMessage);
  if (hasErrors) {
    return json(errors);
  }

  invariant(typeof title === "string", "Title must be a string");
  invariant(typeof slug === "string", "Slug must be a string");
  invariant(typeof markdown === "string", "Markdown must be a string");

  await updatePost({ title, slug, markdown });

  return redirect("/posts/admin");
};

const inputClassName =
  "w-full rounded border border-gray-500 px-2 py-1 text-lg";

export default function EditPost() {
  const errors = useActionData<typeof action>();

  const navigation = useNavigation();
  const isUpdating = Boolean(navigation.state === "submitting");

  const { post } = useLoaderData<typeof loader>();

  return (
    <Form method="post" key={post.slug}>
      <p>
        <label>
          Post Title:{" "}
          {errors?.title ? (
            <em className="text-red-600">{errors.title}</em>
          ) : null}
          <input
            type="text"
            name="title"
            className={inputClassName}
            defaultValue={post.title}
          />
        </label>
      </p>
      <p>
        <label>
          Post Slug:{" "}
          {errors?.slug ? (
            <em className="text-red-600">{errors.slug}</em>
          ) : null}
          <input
            type="text"
            name="slug"
            className={inputClassName}
            defaultValue={post.slug}
            readOnly
            disabled
          />
        </label>
      </p>
      <p>
        <label htmlFor="markdown">
          Markdown:{" "}
          {errors?.markdown ? (
            <em className="text-red-600">{errors.markdown}</em>
          ) : null}
        </label>
        <br />
        <textarea
          id="markdown"
          rows={20}
          name="markdown"
          className={`${inputClassName} font-mono`}
          defaultValue={post.markdown}
        />
      </p>
      <p className="text-right">
        <button
          type="submit"
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
          disabled={isUpdating}
        >
          {isUpdating ? "Updating..." : "Update Post"}
        </button>
      </p>
    </Form>
  );
}
