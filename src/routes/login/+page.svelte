<script>
  import { enhance } from '$app/forms';

  let { form } = $props();
</script>

<h1 class="text-primary mb-6 text-center text-3xl font-bold">Вход / Регистрация</h1>
<form
  method="post"
  action="?/login"
  use:enhance
  class="bg-base-100 mx-auto flex max-w-md flex-col gap-5 rounded-xl p-8 shadow-xl"
>
  <div class="form-control w-full">
    <label class="label" for="username">
      <span class="label-text">Имя пользователя</span>
    </label>
    <input
      id="username"
      name="username"
      type="text"
      placeholder="Введите имя пользователя"
      class="input input-bordered w-full"
      required
    />
  </div>

  <div class="form-control w-full">
    <label class="label" for="password">
      <span class="label-text">Пароль</span>
    </label>
    <input
      id="password"
      name="password"
      type="password"
      placeholder="Введите пароль"
      class="input input-bordered w-full"
      required
    />
  </div>

  <div class="flex flex-row justify-between gap-4">
    <button type="submit" class="btn btn-primary w-1/2">Войти</button>
    <button type="submit" formaction="?/register" class="btn btn-secondary w-1/2"
      >Зарегистрироваться</button
    >
  </div>
</form>

{#if form?.message}
  <p class="text-error mt-4 text-center">{form.message}</p>
{/if}
