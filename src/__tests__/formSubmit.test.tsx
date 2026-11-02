import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
    Checkbox,
    HorizonProvider,
    Input,
    RadioGroup,
    RadioGroupItem,
    Select,
    SelectItem,
    Switch,
} from '../index';

/*
 * Native form participation: every control submits its value under `name`,
 * honours `required` in constraint validation and can join an external
 * form by `form="<id>"` (Radix renders hidden native inputs for this).
 */

const data = (id: string) =>
    Object.fromEntries(
        new FormData(document.getElementById(id) as HTMLFormElement)
    );

describe('form participation', () => {
    it('submits every control under its name', async () => {
        const user = userEvent.setup();
        render(
            <HorizonProvider>
                <form id="f">
                    <Input
                        name="company"
                        defaultValue="Acme"
                        aria-label="Company"
                    />
                    <Checkbox
                        name="news"
                        value="yes"
                        aria-label="News"
                        defaultChecked
                    />
                    <Switch
                        name="alerts"
                        value="on"
                        aria-label="Alerts"
                        defaultChecked
                    />
                    <RadioGroup
                        name="plan"
                        aria-label="Plan"
                        defaultValue="pro"
                    >
                        <RadioGroupItem value="basic" label="Basic" />
                        <RadioGroupItem value="pro" label="Pro" />
                    </RadioGroup>
                    <Select
                        name="country"
                        aria-label="Country"
                        placeholder="Pick"
                    >
                        <SelectItem value="il">Israel</SelectItem>
                        <SelectItem value="fr">France</SelectItem>
                    </Select>
                </form>
            </HorizonProvider>
        );
        await user.click(screen.getByRole('combobox'));
        await user.click(await screen.findByRole('option', { name: 'France' }));
        expect(data('f')).toEqual({
            company: 'Acme',
            news: 'yes',
            alerts: 'on',
            plan: 'pro',
            country: 'fr',
        });
    });

    it('required empty Select (and Checkbox) block validity until filled', async () => {
        const user = userEvent.setup();
        render(
            <HorizonProvider>
                <form id="r">
                    <Select name="country" required aria-label="Country">
                        <SelectItem value="il">Israel</SelectItem>
                    </Select>
                    <Checkbox name="terms" required aria-label="Terms" />
                </form>
            </HorizonProvider>
        );
        const form = document.getElementById('r') as HTMLFormElement;
        expect(form.checkValidity()).toBe(false);
        await user.click(screen.getByRole('combobox'));
        await user.click(await screen.findByRole('option', { name: 'Israel' }));
        await user.click(screen.getByRole('checkbox', { name: 'Terms' }));
        expect(form.checkValidity()).toBe(true);
    });

    it('joins an external form by form="<id>" (Select, Checkbox, Switch, RadioGroup, Input)', async () => {
        const user = userEvent.setup();
        render(
            <HorizonProvider>
                <form id="ext" />
                <Input form="ext" name="q" defaultValue="x" aria-label="Q" />
                <Checkbox
                    form="ext"
                    name="c"
                    value="1"
                    defaultChecked
                    aria-label="C"
                />
                <Switch
                    form="ext"
                    name="s"
                    value="1"
                    defaultChecked
                    aria-label="S"
                />
                <RadioGroup form="ext" name="r" aria-label="R" defaultValue="a">
                    <RadioGroupItem value="a" label="A" />
                </RadioGroup>
                <Select
                    form="ext"
                    name="sel"
                    aria-label="Sel"
                    defaultValue="il"
                    autoComplete="country"
                >
                    <SelectItem value="il">Israel</SelectItem>
                </Select>
            </HorizonProvider>
        );
        const trigger = screen.getByRole('combobox');
        expect(trigger).not.toHaveAttribute('form');
        expect(trigger).not.toHaveAttribute('autocomplete');
        await user.click(document.body);
        expect(data('ext')).toEqual({
            q: 'x',
            c: '1',
            s: '1',
            r: 'a',
            sel: 'il',
        });
    });
});
