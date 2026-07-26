import { RecipeForm } from "./RecipeForm";
import { createRecipe } from "../actions";

export default function NewRecipePage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-4 text-lg font-semibold">Add recipe</h1>
      <RecipeForm action={createRecipe} showImport submitLabel="Save recipe" />
    </div>
  );
}
