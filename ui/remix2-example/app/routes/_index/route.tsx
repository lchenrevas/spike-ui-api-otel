import type { LoaderFunction } from "@remix-run/server-runtime";
import { useLoaderData } from "@remix-run/react";
import { container } from "~/main";

export const loader: LoaderFunction = async (args) => {
  return (await container()).resolve<LoaderFunction>("_index.loader")(args);
};

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <div>
      {loaderData.message}
      <p>
      {loaderData.title}
      </p>
    </div>
  );
}
