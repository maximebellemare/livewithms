
-- Diet plan templates (admin-managed content)
CREATE TABLE public.diet_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '🥗',
  food_lists JSONB NOT NULL DEFAULT '{}',
  recipes JSONB NOT NULL DEFAULT '[]',
  daily_goals JSONB NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view diet plans"
ON public.diet_plans FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage diet plans"
ON public.diet_plans FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- User's selected diet plan with customizations (swapped recipes)
CREATE TABLE public.user_diet_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.diet_plans(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT true,
  swapped_recipes JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_diet_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diet plan selections"
ON public.user_diet_plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own diet plan selections"
ON public.user_diet_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diet plan selections"
ON public.user_diet_plans FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own diet plan selections"
ON public.user_diet_plans FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_diet_plans_updated_at
BEFORE UPDATE ON public.diet_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_diet_plans_updated_at
BEFORE UPDATE ON public.user_diet_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the 5 MS-friendly diet plans
INSERT INTO public.diet_plans (name, description, emoji, sort_order, food_lists, recipes, daily_goals) VALUES
(
  'Anti-Inflammatory',
  'Reduce chronic inflammation linked to MS progression. Rich in omega-3s, antioxidants, and whole foods.',
  '🔥',
  1,
  '{"eat_more":["Fatty fish (salmon, sardines, mackerel)","Leafy greens (spinach, kale, Swiss chard)","Berries (blueberries, strawberries)","Turmeric & ginger","Olive oil (extra virgin)","Nuts (walnuts, almonds)","Avocados","Sweet potatoes","Green tea","Dark chocolate (70%+)"],"limit":["Red meat (1-2x/week max)","Dairy (choose fermented options)","Eggs (moderate)","Coffee (2 cups max)"],"avoid":["Processed foods & fast food","Refined sugar & white flour","Trans fats & fried foods","Excessive alcohol","Artificial sweeteners","Processed meats (bacon, sausages)"]}',
  '[{"id":"ai1","name":"Turmeric Salmon Bowl","meal":"dinner","ingredients":["salmon fillet","brown rice","turmeric","spinach","avocado","lemon"],"instructions":"Season salmon with turmeric and bake at 400°F for 12 min. Serve over brown rice with sautéed spinach and sliced avocado."},{"id":"ai2","name":"Berry Antioxidant Smoothie","meal":"breakfast","ingredients":["blueberries","spinach","almond milk","flaxseed","banana","ginger"],"instructions":"Blend all ingredients until smooth. Add ice for thickness."},{"id":"ai3","name":"Walnut Kale Salad","meal":"lunch","ingredients":["kale","walnuts","cranberries","olive oil","lemon juice","feta"],"instructions":"Massage kale with olive oil and lemon. Top with walnuts, cranberries, and crumbled feta."},{"id":"ai4","name":"Ginger Sweet Potato Soup","meal":"dinner","ingredients":["sweet potatoes","ginger","coconut milk","onion","garlic","cumin"],"instructions":"Roast sweet potatoes, then blend with sautéed onion, garlic, ginger, coconut milk, and cumin."},{"id":"ai5","name":"Green Tea Overnight Oats","meal":"breakfast","ingredients":["oats","matcha powder","almond milk","honey","chia seeds","banana"],"instructions":"Mix oats, matcha, chia seeds, and almond milk. Refrigerate overnight. Top with banana slices."}]',
  '["Eat 2+ servings of omega-3 rich foods","Include colorful vegetables at every meal","Use turmeric or ginger in cooking","Drink green tea instead of coffee","Choose whole grains over refined"]'
),
(
  'Mediterranean',
  'Heart-healthy diet shown to reduce fatigue and improve cognitive function in MS. Emphasizes fresh produce, fish, and healthy fats.',
  '🫒',
  2,
  '{"eat_more":["Olive oil (primary cooking fat)","Fish & seafood (2-3x/week)","Fresh vegetables & salads","Legumes (lentils, chickpeas, beans)","Whole grains (quinoa, bulgur, farro)","Fresh herbs (basil, oregano, parsley)","Tomatoes & peppers","Nuts & seeds","Citrus fruits","Yogurt & fermented foods"],"limit":["Poultry (moderate portions)","Eggs (4-6/week)","Cheese (small amounts)","Red wine (1 glass max)"],"avoid":["Processed meats","Refined grains & white bread","Added sugars","Butter & margarine","Sodas & sweetened drinks","Fast food"]}',
  '[{"id":"md1","name":"Greek Chickpea Bowl","meal":"lunch","ingredients":["chickpeas","cucumber","tomatoes","red onion","feta","olive oil","lemon","oregano"],"instructions":"Toss chickpeas with diced cucumber, tomatoes, red onion. Drizzle with olive oil and lemon, top with feta and oregano."},{"id":"md2","name":"Baked Lemon Herb Fish","meal":"dinner","ingredients":["white fish fillet","lemon","garlic","cherry tomatoes","olives","capers","fresh herbs"],"instructions":"Place fish in baking dish with tomatoes, olives, capers. Drizzle with olive oil, lemon, garlic. Bake 20 min at 375°F."},{"id":"md3","name":"Farro Mediterranean Salad","meal":"lunch","ingredients":["farro","roasted peppers","artichoke hearts","sun-dried tomatoes","arugula","balsamic"],"instructions":"Cook farro, cool slightly. Toss with chopped vegetables, arugula, and balsamic dressing."},{"id":"md4","name":"Shakshuka","meal":"breakfast","ingredients":["eggs","canned tomatoes","onion","bell pepper","cumin","paprika","feta"],"instructions":"Sauté onion and pepper, add tomatoes and spices. Make wells, crack eggs in. Cover and cook 8 min. Top with feta."},{"id":"md5","name":"Lentil Soup","meal":"dinner","ingredients":["red lentils","carrots","celery","onion","garlic","cumin","lemon"],"instructions":"Sauté vegetables, add lentils and broth. Simmer 25 min. Season with cumin and lemon juice."}]',
  '["Use olive oil as your primary fat","Eat fish or seafood 2-3 times this week","Include legumes in at least one meal","Eat a large colorful salad","Choose whole grains over refined"]'
),
(
  'Low Sodium',
  'Helps manage blood pressure and reduce water retention, which can worsen MS symptoms. Focus on fresh, unprocessed foods.',
  '🧂',
  3,
  '{"eat_more":["Fresh fruits & vegetables","Herbs & spices (for flavor)","Unsalted nuts & seeds","Fresh fish & poultry","Whole grains (plain oats, rice)","Homemade soups & sauces","Lemon & vinegar (as seasoning)","Potassium-rich foods (bananas, potatoes)","Fresh garlic & onion","Unsweetened yogurt"],"limit":["Bread (check labels)","Cheese (choose low-sodium)","Canned goods (rinse well)","Condiments (use sparingly)"],"avoid":["Table salt & sea salt","Processed & deli meats","Canned soups & sauces","Soy sauce & teriyaki","Pickles & olives","Frozen dinners & pizza","Salted snacks (chips, pretzels)","Fast food"]}',
  '[{"id":"ls1","name":"Herb-Crusted Chicken","meal":"dinner","ingredients":["chicken breast","rosemary","thyme","garlic","lemon","olive oil","roasted vegetables"],"instructions":"Coat chicken with herbs, garlic, and olive oil. Bake at 400°F for 25 min. Serve with roasted vegetables."},{"id":"ls2","name":"Fresh Veggie Wrap","meal":"lunch","ingredients":["whole wheat tortilla","hummus (no salt added)","cucumber","tomato","avocado","sprouts","lemon"],"instructions":"Spread hummus on tortilla, layer vegetables, drizzle lemon, and roll tightly."},{"id":"ls3","name":"Banana Oat Pancakes","meal":"breakfast","ingredients":["banana","oats","eggs","cinnamon","vanilla","blueberries"],"instructions":"Blend banana, oats, eggs, cinnamon, vanilla. Cook on medium heat. Top with fresh blueberries."},{"id":"ls4","name":"Garlic Lemon Salmon","meal":"dinner","ingredients":["salmon","garlic","lemon","dill","asparagus","olive oil"],"instructions":"Season salmon with garlic, lemon, dill. Bake with asparagus at 400°F for 15 min."},{"id":"ls5","name":"Homemade Trail Mix","meal":"snack","ingredients":["unsalted almonds","unsalted cashews","dried cranberries","dark chocolate chips","pumpkin seeds"],"instructions":"Mix all ingredients. Store in airtight container. ¼ cup = 1 serving."}]',
  '["Cook at home to control sodium","Use herbs & spices instead of salt","Read labels — aim under 1500mg/day","Rinse canned beans & vegetables","Make your own salad dressing"]'
),
(
  'High Fiber',
  'Supports gut health and microbiome diversity, increasingly linked to MS outcomes. Promotes steady energy and reduces fatigue.',
  '🌾',
  4,
  '{"eat_more":["Beans & lentils","Whole grains (oats, barley, quinoa)","Vegetables (broccoli, Brussels sprouts, artichokes)","Berries & apples (with skin)","Chia seeds & flaxseeds","Sweet potatoes","Avocados","Pears & bananas","Almonds & pistachios","Popcorn (air-popped)"],"limit":["White rice (choose brown)","Pasta (choose whole wheat)","Juice (eat whole fruit instead)","Dried fruit (high sugar)"],"avoid":["White bread & refined flour","Sugary cereals","Processed snacks","Peeled fruits & vegetables","Fast food","Low-fiber convenience foods"]}',
  '[{"id":"hf1","name":"Overnight Chia Pudding","meal":"breakfast","ingredients":["chia seeds","almond milk","berries","honey","vanilla","sliced almonds"],"instructions":"Mix chia seeds with almond milk and vanilla. Refrigerate 6+ hours. Top with berries and almonds."},{"id":"hf2","name":"Black Bean Buddha Bowl","meal":"lunch","ingredients":["black beans","brown rice","roasted sweet potato","avocado","corn","lime","cilantro"],"instructions":"Layer brown rice, black beans, roasted sweet potato, corn. Top with avocado and lime-cilantro dressing."},{"id":"hf3","name":"Lentil & Vegetable Stew","meal":"dinner","ingredients":["green lentils","carrots","celery","tomatoes","spinach","cumin","garlic"],"instructions":"Sauté vegetables, add lentils and broth. Simmer 30 min. Stir in spinach at the end."},{"id":"hf4","name":"Apple Almond Butter Toast","meal":"snack","ingredients":["whole grain bread","almond butter","apple slices","cinnamon","chia seeds"],"instructions":"Toast bread, spread almond butter, top with apple slices, cinnamon, and chia seeds."},{"id":"hf5","name":"Barley Mushroom Risotto","meal":"dinner","ingredients":["pearl barley","mushrooms","onion","garlic","vegetable broth","parmesan","thyme"],"instructions":"Toast barley, add broth gradually while stirring. Sauté mushrooms separately and fold in with parmesan."}]',
  '["Aim for 25-30g fiber daily","Start meals with vegetables","Choose whole fruit over juice","Add beans or lentils to one meal","Include a high-fiber snack (nuts, seeds)"]'
),
(
  'Gluten-Free',
  'May help reduce inflammation and gut permeability in some people with MS. Focuses on naturally gluten-free whole foods.',
  '🚫',
  5,
  '{"eat_more":["Rice & rice noodles","Quinoa & buckwheat","Potatoes & sweet potatoes","Corn & polenta","Fresh fruits & vegetables","Eggs, fish & meat (unprocessed)","Beans & lentils","Nuts & seeds","Dairy (plain, unflavored)","Oats (certified gluten-free)"],"limit":["Gluten-free processed foods","Gluten-free bread (often low nutrition)","Rice cakes (low satiety)","Corn chips"],"avoid":["Wheat, barley, rye","Regular bread, pasta & cereal","Beer & malt beverages","Soy sauce (use tamari)","Many processed sauces & gravies","Baked goods (cakes, cookies, pastries)","Breaded or battered foods","Couscous & bulgur"]}',
  '[{"id":"gf1","name":"Quinoa Power Bowl","meal":"lunch","ingredients":["quinoa","roasted chickpeas","sweet potato","kale","tahini","lemon"],"instructions":"Cook quinoa, roast chickpeas and sweet potato. Assemble bowl with massaged kale and drizzle tahini-lemon dressing."},{"id":"gf2","name":"GF Banana Pancakes","meal":"breakfast","ingredients":["bananas","eggs","almond flour","vanilla","cinnamon","maple syrup"],"instructions":"Blend bananas, eggs, almond flour, vanilla, cinnamon. Cook on greased pan. Drizzle with maple syrup."},{"id":"gf3","name":"Stuffed Bell Peppers","meal":"dinner","ingredients":["bell peppers","ground turkey","rice","tomato sauce","black beans","cumin","cheese"],"instructions":"Cook rice and turkey with beans and spices. Stuff into pepper halves, top with sauce and cheese. Bake 25 min at 375°F."},{"id":"gf4","name":"Thai Coconut Curry","meal":"dinner","ingredients":["coconut milk","chicken or tofu","bell peppers","basil","rice noodles","fish sauce","lime"],"instructions":"Simmer coconut milk with curry paste, add protein and vegetables. Serve over rice noodles with lime and basil."},{"id":"gf5","name":"Sweet Potato Toast","meal":"snack","ingredients":["sweet potato (sliced lengthwise)","avocado","everything bagel seasoning","cherry tomatoes"],"instructions":"Toast sweet potato slices in toaster 2-3 cycles until tender. Top with smashed avocado, tomatoes, and seasoning."}]',
  '["Read all food labels for hidden gluten","Cook naturally GF meals (rice, potatoes)","Use tamari instead of soy sauce","Try GF grains: quinoa, buckwheat, millet","Prep snacks to avoid grabbing gluten foods"]'
);
