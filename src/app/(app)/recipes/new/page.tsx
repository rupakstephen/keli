import { RecipeForm } from "./RecipeForm";

export default function NewRecipePage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-lg font-semibold">Add recipe</h1>
      <RecipeForm />
    </div>
  );
}
